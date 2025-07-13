import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { incrementCounter, logError, trackTokenUsage } from '@/lib/admin-stats';

// --- Smart API Key Manager ---
const apiKeys = (process.env.GEMINI_API_KEYS || '').split(',').map(key => key.trim()).filter(Boolean);
if (apiKeys.length === 0) {
  throw new Error('GEMINI_API_KEYS is not set or empty in environment variables.');
}

// Removed debug logging that could expose API key information for security

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

const MODEL_NAME = "gemini-2.5-pro";

// Define the expected JSON structure for the AI's response
const jsonOutputSchema = {
    score: "number (1-5, e.g., 4.2)",
    sentiment: "'poor' | 'fair' | 'good' | 'excellent'",
    isValidResume: "boolean (true if this is actually a resume/CV, false otherwise)",
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

// --- Resilient AI Generation with Failover ---
async function generateWithFailover(prompt: string, retries = apiKeys.length) {
  let attempts = 0;
  while (attempts < retries) {
    const client = getAIClient();
    const model = client.getGenerativeModel({ model: MODEL_NAME });
    
    // Log which key index we are trying
    const keyIndex = (currentClientIndex - 1 + apiKeys.length) % apiKeys.length;
    console.log(`Attempt ${attempts + 1}/${retries}: Using API Key #${keyIndex + 1}`);

    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
        safetySettings,
      });
      // If we get a result, return it immediately.
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown API error';
      console.warn(`API Key #${keyIndex + 1} failed. Error: ${errorMessage}`);
      await logError(`API Key #${keyIndex + 1} failed: ${errorMessage}`);
      
      attempts++;
      if (attempts >= retries) {
        // If we've exhausted all keys, throw the last error.
        console.error("All API keys failed.");
        throw new Error("All AI models are currently unavailable. Please try again later.");
      }
      // Otherwise, the loop will continue with the next key.
    }
  }
  // This part should be unreachable, but as a fallback:
  throw new Error("Failed to generate content after multiple attempts.");
}
// ------------------------------------------


const buildPrompt = (resumeText: string) => `
You are an expert resume analyst. Analyze this resume and provide structured feedback.

**FIRST: RESUME VALIDATION**
Before analyzing, determine if this is actually a resume/CV. A valid resume should contain:
- Professional contact information (name, email, phone)
- Work experience OR education section
- Skills or qualifications relevant to employment
- Professional formatting and structure

If it's NOT a resume (e.g., random text, stories, recipes, etc.), set isValidResume to false.

**ANALYSIS REQUIREMENTS:**
1. **Content & Impact**: Quantified achievements, action verbs, clear impact
2. **Formatting**: Scannable layout, consistent dates, professional presentation  
3. **Skills**: Relevant, categorized skills for modern roles
4. **Contact**: Professional email, LinkedIn presence

**CRITICAL RULES:**
- NEVER flag personal names as errors
- Focus on substance, not proper nouns
- Identify both improvements AND successes
- Be encouraging yet constructive

**HR PERSPECTIVE:** Write as a hiring manager reviewing this resume.

**JSON OUTPUT REQUIRED:**
${JSON.stringify(
  {
    score: "number (1-5)",
    sentiment: "'poor' | 'fair' | 'good' | 'excellent'",
    isValidResume: "boolean (true if this is actually a resume/CV, false otherwise)",
    suggestions: [
      {
        type: "'improvement' | 'success' | 'warning' | 'error'",
        category: "'Formatting' | 'Content' | 'Skills' | 'Contact' | 'Experience' | 'Education' | 'General'",
        message: "string",
        impact: "'low' | 'medium' | 'high' | 'positive'",
        section: "string",
        priority: "number (1-5)",
        actionable: "string"
      }
    ],
    summary: {
      strengths: ["string"],
      improvements: ["string"]
    },
    hrPerspective: {
      sentiment: "'positive' | 'neutral' | 'negative'",
      summary: "string"
    }
  },
  null,
  2
)}

**Resume:**
---
${resumeText}
---`;

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

    console.log(`📝 Calling Gemini API with model: ${MODEL_NAME}`);
    const result = await generateWithFailover(prompt);

    const responseJson = result.response.text();
    const parsedResponse = JSON.parse(responseJson);

    console.log('🎉 Analysis response generated successfully');
    
    // Track token usage for monitoring
    const estimatedTokens = Math.ceil((text.length + responseJson.length) / 4); // Rough estimate: 4 chars per token
    await trackTokenUsage('analysis', estimatedTokens, MODEL_NAME);
    
    // Track successful analysis
    await incrementCounter('totalAnalyses');
    
    return res.status(200).json(parsedResponse);

  } catch (error) {
    console.error('❌ Error analyzing resume with Gemini API:', error);
    
    // Log the error for admin tracking
    await logError(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    if (error instanceof Error) {
      if (error.message.includes('503') || error.message.includes('overloaded')) {
        return res.status(503).json({ error: 'The AI model is currently overloaded. Please try again in a few moments.' });
      }
      if (error.message.includes('JSON')) {
        // Let's try to repair the JSON
        const responseText = error.stack || error.toString();
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch && jsonMatch[0]) {
          try {
            const repairedJson = JSON.parse(jsonMatch[0]);
            console.log('🔧 Repaired malformed JSON from Gemini response');
            
            // Track successful analysis even if we had to repair JSON
            await incrementCounter('totalAnalyses');
            
            return res.status(200).json(repairedJson);
          } catch (parseError) {
            console.error('❌ Failed to repair JSON:', parseError);
            await logError(`JSON repair failed: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
            return res.status(500).json({ error: 'The AI returned an invalid response that could not be repaired.' });
          }
        }
        return res.status(500).json({ error: 'The AI returned an invalid response. Please try again.' });
      }
    }
    return res.status(500).json({ error: 'Failed to analyze resume due to an unexpected error.' });
  }
} 