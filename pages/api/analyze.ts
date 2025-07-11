import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// --- Smart API Key Manager ---
const apiKeys = (process.env.GEMINI_API_KEYS || '').split(',').filter(Boolean);
if (apiKeys.length === 0) {
  throw new Error('GEMINI_API_KEYS is not set or empty in environment variables.');
}

let currentKeyIndex = 0;
const getApiKey = () => {
  const key = apiKeys[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
  return key;
};

// Create a pool of clients to reuse
const aiClients = apiKeys.map(key => new GoogleGenerativeAI(key));
let currentClientIndex = 0;
const getAIClient = () => {
    const client = aiClients[currentClientIndex];
    currentClientIndex = (currentClientIndex + 1) % aiClients.length;
    return client;
}
// ----------------------------

const MODEL_NAME = "gemini-1.5-flash-latest";

// Define the expected JSON structure for the AI's response
const jsonOutputSchema = {
    score: "number (1-5, e.g., 4.2)",
    sentiment: "'poor' | 'fair' | 'good' | 'excellent'",
    suggestions: [
        {
            type: "'improvement' | 'success' | 'warning' | 'error'",
            category: "'Formatting' | 'Content' | 'Skills' | 'Contact' | 'Experience' | 'Education' | 'General'",
            message: "string",
            impact: "'low' | 'medium' | 'high' | 'positive'"
        }
    ],
    summary: {
        strengths: ["string"],
        improvements: ["string"]
    },
    hrPerspective: {
        sentiment: "'positive' | 'neutral' | 'negative'",
        summary: "string (a short, first-person summary from an HR perspective)"
    }
};

const generationConfig = {
    responseMimeType: 'application/json',
    temperature: 0.7,
};

// Safety settings to reduce the likelihood of getting blocked responses.
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];


const buildPrompt = (resumeText: string) => `
You are a world-class career coach and resume analysis expert. Your task is to analyze the provided resume text and return a detailed, actionable analysis.

**CRITICAL INSTRUCTIONS FOR ACCURATE ANALYSIS:**

🚨 **NAMES & PROPER NOUNS**: 
- NEVER flag personal names as spelling errors, regardless of spelling or cultural origin
- Respect names
- Do NOT suggest changes to company names, place names, or personal names
- Focus on actual content and formatting issues, not proper nouns

🎯 **ANALYSIS FOCUS AREAS:**
1. **Content Quality**: Skills relevance, experience descriptions, achievements quantification
2. **Formatting**: Consistency in dates, bullet points, section organization
3. **Professional Language**: Tone, action verbs, industry terminology
4. **Structure**: Logical flow, section hierarchy, information completeness
5. **Impact**: Results-oriented descriptions, measurable achievements

📍 **SPECIFIC SECTION GUIDANCE:**
- **Contact**: Check for professional email, LinkedIn URL, appropriate phone format
- **Objective/Summary**: Look for specificity, value proposition, career goals alignment
- **Experience**: Focus on action verbs, quantified results, relevance to target roles
- **Skills**: Technical accuracy, relevance, proper categorization
- **Education**: Completeness, relevance, proper formatting
- **Formatting**: Date consistency, bullet point alignment, font/spacing uniformity

✍️ **HR PERSPECTIVE**:
- Provide a brief, first-person summary as if you were a hiring manager reviewing this resume.
- Start with phrases like "As a recruiter, I feel...", "My initial impression is...", etc.
- If the resume is strong, be encouraging. 
- If it needs work, be constructive and gentle, e.g., "I'm slightly confused about the main objective here..."

⚡ **ENHANCED OUTPUT REQUIREMENTS:**
For each suggestion, include:
- Specific location/section where the issue occurs
- Clear before/after examples when applicable
- Priority level for improvement order
- Actionable next steps

**STRICT JSON OUTPUT:** Your entire response MUST be a single, valid JSON object that conforms exactly to this schema. Do NOT include any text, markdown, or commentary outside of the JSON object.

**JSON OUTPUT SCHEMA:**
\`\`\`json
${JSON.stringify({
  ...jsonOutputSchema,
  suggestions: [
    {
      type: "'improvement' | 'success' | 'warning' | 'error'",
      category: "'Formatting' | 'Content' | 'Skills' | 'Contact' | 'Experience' | 'Education' | 'General'",
      message: "string",
      impact: "'low' | 'medium' | 'high' | 'positive'",
      section: "string (specific resume section where this applies)",
      priority: "number (1-5, where 1 is highest priority)",
      actionable: "string (specific action the user should take)"
    }
  ]
}, null, 2)}
\`\`\`

**Resume Text to Analyze:**
---
${resumeText}
---

Remember: Focus on helping the candidate improve their resume's effectiveness, not correcting valid names or cultural expressions. Be constructive, specific, and actionable in your feedback.
`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const { text } = req.body;

  if (!text || typeof text !== 'string' || text.trim().length < 50) {
    return res.status(400).json({ error: 'Invalid or insufficient resume text provided. Minimum 50 characters required.' });
  }

  try {
    const prompt = buildPrompt(text);

    // Get a client from the pool for this request
    const genAI = getAIClient();
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
    });

    console.log(`📝 Calling Gemini API with model: ${MODEL_NAME}`);
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
      safetySettings
    });

    const responseJson = result.response.text();
    const parsedResponse = JSON.parse(responseJson);

    console.log('🎉 Analysis response generated successfully');
    return res.status(200).json(parsedResponse);

  } catch (error) {
    console.error('❌ Error analyzing resume with Gemini API:', error);

    if (error instanceof Error) {
        if (error.message.includes('503') || error.message.includes('overloaded')) {
            return res.status(503).json({ error: 'The AI model is currently overloaded. Please try again in a few moments.' });
        }
        if (error.message.includes('JSON')) {
            return res.status(500).json({ error: 'The AI returned an invalid response. Please try again.' });
        }
    }
    
    return res.status(500).json({ error: 'Failed to analyze resume due to an unexpected error.' });
  }
} 