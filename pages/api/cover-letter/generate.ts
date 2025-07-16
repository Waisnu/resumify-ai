import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { incrementCounter, logError, trackTokenUsage } from '@/lib/admin-stats';
import { ValidationError, AIServiceError, handleApiError, validateEnvVar, validateMethod, validateRequiredFields } from '@/lib/error-handler';
import { withRateLimit, latexRateLimiter } from '@/lib/rate-limiter';
import { logger } from '@/lib/secure-logger';
import { PerformanceMonitor } from '@/lib/performance-monitor';
import { withApiHandler, validators, responses } from '@/lib/api-utils';
import { 
  CoverLetterRequest, 
  CoverLetterResult, 
  CoverLetterAnalysis,
  COVER_LETTER_TEMPLATES,
  TONE_GUIDELINES,
  JobDescriptionAnalysis,
  PersonalizationEngine
} from '@/lib/cover-letter-types';

// API Key Management (reuse from existing analyze.ts)
const apiKeys = validateEnvVar('GEMINI_API_KEYS', '').split(',').map(key => key.trim()).filter(Boolean);
if (apiKeys.length === 0) {
  throw new Error('GEMINI_API_KEYS is not set or empty in environment variables.');
}

let currentKeyIndex = 0;
const getApiKey = () => {
  const key = apiKeys[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
  return key;
};

const aiClients = apiKeys.map(key => new GoogleGenerativeAI(key));
let currentClientIndex = 0;
const getAIClient = () => {
  const client = aiClients[currentClientIndex];
  currentClientIndex = (currentClientIndex + 1) % aiClients.length;
  return client;
};

const MODEL_NAME = "gemini-2.5-pro";

const generationConfig = {
  responseMimeType: 'application/json',
  temperature: 0.3, // Slightly higher for more creative cover letters
  maxOutputTokens: 4000,
  topP: 0.8,
  topK: 40,
};

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// Job Description Analysis Function
async function analyzeJobDescription(jobDescription: string): Promise<JobDescriptionAnalysis> {
  const analysisPrompt = `
Analyze this job description and extract key information:

**Job Description:**
${jobDescription}

**Extract and return JSON with:**
{
  "requirements": ["requirement1", "requirement2", ...],
  "skills": ["skill1", "skill2", ...],
  "keywords": ["keyword1", "keyword2", ...],
  "companyValues": ["value1", "value2", ...],
  "tone": "professional|friendly|innovative|corporate",
  "level": "entry|mid|senior|executive"
}

Focus on:
- Required qualifications and experience
- Technical and soft skills mentioned
- Important keywords that should be included
- Company culture and values
- Appropriate tone and communication style
- Seniority level of the position
`;

  const client = getAIClient();
  const model = client.getGenerativeModel({ model: MODEL_NAME });
  
  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: analysisPrompt }] }],
      generationConfig,
      safetySettings,
    });
    
    const response = result.response.text();
    return JSON.parse(response) as JobDescriptionAnalysis;
  } catch (error) {
    console.warn('Job description analysis failed, using defaults:', error);
    return {
      requirements: [],
      skills: [],
      keywords: [],
      companyValues: [],
      tone: 'professional',
      level: 'mid'
    };
  }
}

// Cover Letter Generation Function
async function generateCoverLetter(request: CoverLetterRequest): Promise<CoverLetterResult> {
  const template = COVER_LETTER_TEMPLATES.find(t => t.id === request.templateId) || COVER_LETTER_TEMPLATES[0];
  const toneGuidelines = TONE_GUIDELINES[request.tone || 'professional'];
  
  // Analyze job description if provided
  let jobAnalysis: JobDescriptionAnalysis | null = null;
  if (request.jobDescription) {
    jobAnalysis = await analyzeJobDescription(request.jobDescription);
  }

  const generationPrompt = `
You are an expert cover letter writer with extensive experience in HR and recruitment. Generate a compelling, personalized cover letter.

**REQUIREMENTS:**
- Job Title: ${request.jobTitle}
- Company: ${request.companyName}
- Tone: ${request.tone || 'professional'} (${toneGuidelines.description})
- Length: ${request.length || 'medium'} (short: 250-350 words, medium: 350-500 words, long: 500-650 words)
- Template: ${template.name}

**TEMPLATE STRUCTURE:**
${template.structure.map(section => `- ${section}`).join('\n')}

**TONE CHARACTERISTICS:**
${toneGuidelines.characteristics.map(char => `- ${char}`).join('\n')}

**TONE EXAMPLES:**
${toneGuidelines.examples.map(ex => `- "${ex}"`).join('\n')}

**CANDIDATE RESUME:**
${request.resumeText}

${request.jobDescription ? `
**JOB DESCRIPTION:**
${request.jobDescription}

**JOB ANALYSIS:**
- Required Skills: ${jobAnalysis?.skills.join(', ') || 'N/A'}
- Key Requirements: ${jobAnalysis?.requirements.join(', ') || 'N/A'}
- Important Keywords: ${jobAnalysis?.keywords.join(', ') || 'N/A'}
- Company Values: ${jobAnalysis?.companyValues.join(', ') || 'N/A'}
- Position Level: ${jobAnalysis?.level || 'N/A'}
` : ''}

**CUSTOMIZATIONS:**
${request.customizations ? Object.entries(request.customizations)
  .filter(([_, value]) => value)
  .map(([key, _]) => `- Include ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`)
  .join('\n') : '- Use standard structure'}

**ADDITIONAL INSTRUCTIONS:**
${request.additionalInstructions || 'Follow template structure and maintain professional quality.'}

**CRITICAL REQUIREMENTS:**
1. Personalize for the specific company and role
2. Match the requested tone throughout
3. Highlight relevant experience from the resume
4. Include specific examples and achievements
5. Demonstrate knowledge of the company/role
6. Use strong, action-oriented language
7. Include a compelling call to action
8. Ensure proper business letter formatting
9. Keep within the specified word count
10. Make it authentic and engaging

**JSON OUTPUT REQUIRED:**
{
  "content": "Complete cover letter with proper formatting and line breaks",
  "analysis": {
    "score": 4.5,
    "sentiment": "excellent",
    "suggestions": [
      {
        "type": "success",
        "category": "Content",
        "message": "Strong opening that captures attention",
        "impact": "positive",
        "section": "opening",
        "priority": 1,
        "actionable": "Continue using compelling hooks"
      }
    ],
    "summary": {
      "strengths": ["Personalized approach", "Strong examples", "Clear structure"],
      "improvements": ["Could include more specific metrics", "Consider adding company research"]
    },
    "hrPerspective": {
      "sentiment": "positive",
      "summary": "This cover letter demonstrates genuine interest and relevant experience"
    },
    "keyMetrics": {
      "wordCount": 425,
      "readabilityScore": 85,
      "personalizedElements": 8,
      "skillsMatching": 75
    }
  }
}

Generate a compelling cover letter now:
`;

  const client = getAIClient();
  const model = client.getGenerativeModel({ model: MODEL_NAME });

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: generationPrompt }] }],
      generationConfig,
      safetySettings,
    });

    const responseText = result.response.text();
    const parsedResponse = JSON.parse(responseText);

    // Create cover letter result
    const coverLetterResult: CoverLetterResult = {
      id: `cl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: parsedResponse.content,
      analysis: parsedResponse.analysis,
      template: template,
      metadata: {
        createdAt: new Date().toISOString(),
        wordCount: parsedResponse.analysis.keyMetrics.wordCount,
        estimatedReadTime: Math.ceil(parsedResponse.analysis.keyMetrics.wordCount / 200),
        jobTitle: request.jobTitle,
        companyName: request.companyName,
        version: 1
      }
    };

    return coverLetterResult;

  } catch (error) {
    console.error('Cover letter generation failed:', error);
    throw new AIServiceError('Failed to generate cover letter. Please try again.');
  }
}

// Main API Handler
// Validation function for cover letter request
function validateCoverLetterRequest(body: any) {
  const { resumeText, jobTitle, companyName, tone, length, jobDescription } = body;
  
  // Validate required string fields
  validators.stringNonEmpty(resumeText, 'Resume text');
  validators.stringNonEmpty(jobTitle, 'Job title');
  validators.stringNonEmpty(companyName, 'Company name');
  
  // Validate optional fields
  if (tone) {
    validators.oneOf(tone, ['professional', 'friendly', 'confident', 'conversational'], 'Tone');
  }
  
  if (length) {
    validators.oneOf(length, ['short', 'medium', 'long'], 'Length');
  }
  
  if (jobDescription) {
    validators.string(jobDescription, 'Job description');
  }
}

async function coverLetterHandler(
  req: NextApiRequest,
  res: NextApiResponse<{ result?: CoverLetterResult; error?: string }>
) {
  const request = req.body as CoverLetterRequest;
  
  // Additional validation
  const trimmedResumeText = request.resumeText.trim();
  if (trimmedResumeText.length < 100) {
    throw new ValidationError('Resume text must be at least 100 characters long.');
    }

    if (trimmedResumeText.length > 50000) {
      throw new ValidationError('Resume text is too long. Maximum 50,000 characters allowed.');
    }

    // Validate optional fields
    if (request.tone && !['professional', 'friendly', 'confident', 'conversational'].includes(request.tone)) {
      throw new ValidationError('Invalid tone. Must be one of: professional, friendly, confident, conversational.');
    }

    if (request.length && !['short', 'medium', 'long'].includes(request.length)) {
      throw new ValidationError('Invalid length. Must be one of: short, medium, long.');
    }

    if (request.templateId && !COVER_LETTER_TEMPLATES.some(t => t.id === request.templateId)) {
      throw new ValidationError('Invalid template ID.');
    }

    // Generate cover letter
    logger.info('Cover letter generation started', { jobTitle: request.jobTitle, companyName: request.companyName });
    
    const timer = PerformanceMonitor.startTiming('cover-letter-generation');
    const result = await generateCoverLetter(request);
    timer.end(true, { jobTitle: request.jobTitle, companyName: request.companyName });

    // Track usage
    const estimatedTokens = Math.ceil((request.resumeText.length + (request.jobDescription?.length || 0) + result.content.length) / 4);
    // await trackTokenUsage('cover-letter', estimatedTokens, MODEL_NAME); // TODO: Add to admin stats
    // await incrementCounter('totalCoverLetters'); // TODO: Add to admin stats

    logger.info('Cover letter generation completed successfully');
    
    // Send success response
    res.status(200).json({ result });
}

// Apply rate limiting and API utilities
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ result?: CoverLetterResult; error?: string }>
) {
  const rateLimitMiddleware = withRateLimit(latexRateLimiter);
  
  const apiHandler = withApiHandler(
    {
      operation: 'cover-letter-generation',
      allowedMethods: ['POST'],
      requiredFields: ['resumeText', 'jobTitle', 'companyName'],
      validateInput: validateCoverLetterRequest
    },
    coverLetterHandler
  );
  
  await rateLimitMiddleware(req, res, async () => {
    await apiHandler(req, res);
  });
}