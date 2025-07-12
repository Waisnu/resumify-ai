import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import path from 'path';
import fs from 'fs/promises';
import { incrementCounter, logError } from '@/lib/admin-stats';

// --- Smart API Key Manager ---
const apiKeys = (process.env.GEMINI_API_KEYS || '').split(',').map(key => key.trim()).filter(Boolean);
if (apiKeys.length === 0) {
  throw new Error('GEMINI_API_KEYS is not set or empty in environment variables.');
}

const aiClients = apiKeys.map(key => new GoogleGenerativeAI(key));
let currentClientIndex = 0;
const getAIClient = () => {
    const client = aiClients[currentClientIndex];
    currentClientIndex = (currentClientIndex + 1) % aiClients.length;
    return client;
}
// ----------------------------

const MODEL_NAME = "gemini-1.5-flash-latest";

const generationConfig = {
    responseMimeType: 'application/json',
    temperature: 0.3, // Lower temperature for more predictable, structured output
};

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// --- Resilient AI Generation with Failover ---
async function generateWithFailover(prompt: string, retries = apiKeys.length) {
  let attempts = 0;
  while (attempts < retries) {
    const client = getAIClient();
    const model = client.getGenerativeModel({ model: MODEL_NAME });

    const keyIndex = (currentClientIndex - 1 + apiKeys.length) % apiKeys.length;
    console.log(`Attempt ${attempts + 1}/${retries}: Using API Key #${keyIndex + 1} for LaTeX generation.`);

    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
        safetySettings,
      });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown API error';
      console.warn(`LaTeX Gen API Key #${keyIndex + 1} failed. Error: ${errorMessage}`);
      await logError(`LaTeX Gen API Key #${keyIndex + 1} failed: ${errorMessage}`);
      
      attempts++;
      if (attempts >= retries) {
        console.error("All API keys failed for LaTeX generation.");
        throw new Error("All AI models are currently unavailable for LaTeX generation.");
      }
    }
  }
  throw new Error("Failed to generate LaTeX content after multiple attempts.");
}
// ------------------------------------------

const buildPrompt = (resumeText: string, templateContent: string, templateId: string) => `
You are a LaTeX resume expert. Convert the resume text into LaTeX using the provided template.

**INSTRUCTIONS:**
1. Use the template structure exactly - don't add packages or redefine commands
2. Improve wording: stronger action verbs, consistent tense, fix grammar
3. Map resume data to template sections appropriately
4. Output clean, well-formatted LaTeX code

**TEMPLATE (${templateId}.tex):**
\`\`\`latex
${templateContent}
\`\`\`

**RESUME TEXT:**
${resumeText}

**REQUIRED JSON OUTPUT FORMAT:**
You MUST respond with ONLY a valid JSON object in this exact format:
{
  "generatedCode": "Complete LaTeX code ready to compile"
}

Do not include any text before or after the JSON object.`;

type LaTeXRecommendation = {
  generatedCode: string;
};

// Map template IDs to their file paths for security and convenience
const templateFileMap: { [key: string]: string } = {
  'developer-cv': 'LaTeXTemplates_developer-cv_v1.1/main.tex',
  'medium-length-professional-cv': 'LaTeXTemplates_medium-length-professional-cv_v3.0/template.tex',
  'stylish-cv': 'LatexTemplates_stylish/template.tex',
  'freeman-cv': 'LaTeXTemplates_freeman-cv_v3.0/template.tex',
  'awesome-resume-cv': 'LaTeXTemplates_awesome-resume-cv_v1.3/resume_cv.tex',
  'compact-academic-cv': 'LaTeXTemplates_compact-academic-cv_v2.0/main.tex',
};


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ recommendation?: LaTeXRecommendation; error?: string }>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { resumeText, templateId } = req.body;

    if (!resumeText) {
      return res.status(400).json({ error: 'Resume text is required' });
    }
    if (!templateId || typeof templateId !== 'string' || !templateFileMap[templateId]) {
      return res.status(400).json({ error: 'A valid template ID is required' });
    }

    // --- Read Template File ---
    const templateFileName = templateFileMap[templateId];
    const templatePath = path.join(process.cwd(), 'Latex-templates', 'Templates', templateFileName);
    
    let templateContent = '';
    try {
      templateContent = await fs.readFile(templatePath, 'utf-8');
    } catch (fileError) {
      console.error(`❌ Could not read template file: ${templatePath}`, fileError);
      await logError(`Template file read failed: ${templatePath}`);
      return res.status(500).json({ error: 'Could not load the selected resume template.' });
    }
    // --------------------------

    const prompt = buildPrompt(resumeText, templateContent, templateId);
    
    console.log(`📝 Calling Gemini API for LaTeX generation with model: ${MODEL_NAME}`);
    const result = await generateWithFailover(prompt);

    const responseJson = result.response.text();
    console.log('🔍 Raw AI Response:', responseJson.substring(0, 200) + '...');
    
    // Sometimes the model returns markdown with the json, let's strip it.
    const sanitizedJson = responseJson.replace(/```json\n/g, '').replace(/\n```/g, '');
    console.log('🔍 Sanitized JSON:', sanitizedJson.substring(0, 200) + '...');

    let parsedResponse: LaTeXRecommendation;
    try {
      parsedResponse = JSON.parse(sanitizedJson) as LaTeXRecommendation;
      console.log('🔍 Parsed Response Keys:', Object.keys(parsedResponse));
      console.log('🔍 Generated Code Type:', typeof parsedResponse.generatedCode);
      console.log('🔍 Generated Code Length:', parsedResponse.generatedCode?.length || 'undefined');
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      console.error('❌ Failed to parse JSON:', sanitizedJson);
      await logError(`JSON parsing failed: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      return res.status(500).json({ error: 'The AI returned an invalid response format.' });
    }

    // Validate the response structure
    if (!parsedResponse.generatedCode) {
      console.error('❌ Missing generatedCode in response:', parsedResponse);
      await logError('AI response missing generatedCode property');
      return res.status(500).json({ error: 'The AI response was incomplete. Please try again.' });
    }

    // A little bit of post-processing to ensure formatting is good
    parsedResponse.generatedCode = parsedResponse.generatedCode.replace(/\\ /g, ' ');

    console.log('🎉 Improved LaTeX Recommendation generated successfully');
    
    // Track successful LaTeX generation
    await incrementCounter('totalLatexGenerations');
    
    return res.status(200).json({ recommendation: parsedResponse });

  } catch (error) {
    console.error('❌ Error generating LaTeX recommendation with Gemini API:', error);
    
    // Log the error for admin tracking
    await logError(`LaTeX generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
     if (error instanceof Error) {
        if (error.message.includes('503') || error.message.includes('overloaded')) {
            return res.status(503).json({ error: 'The AI model is currently overloaded. Please try again in a few moments.' });
        }
        if (error.message.includes('JSON')) {
            // Let's try to repair the JSON
            const responseText = error.stack || error.toString();
            const jsonMatch = responseText.match(/\{[\s\S]*\}/); // More robust regex for JSON
            if (jsonMatch && jsonMatch[0]) {
                try {
                    const repairedJson = JSON.parse(jsonMatch[0]);
                    console.log('🔧 Repaired malformed JSON from Gemini response');
                    
                    // Track successful LaTeX generation even if we had to repair JSON
                    await incrementCounter('totalLatexGenerations');
                    
                    return res.status(200).json({ recommendation: repairedJson });
                } catch (parseError) {
                     console.error('❌ Failed to repair JSON:', parseError);
                     await logError(`LaTeX JSON repair failed: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
                     return res.status(500).json({ error: 'The AI returned an invalid response that could not be repaired.' });
                }
            }
            return res.status(500).json({ error: 'The AI returned an invalid response. Please try again.' });
        }
    }
    return res.status(500).json({ error: 'Failed to generate recommendation due to an unexpected error.' });
  }
} 