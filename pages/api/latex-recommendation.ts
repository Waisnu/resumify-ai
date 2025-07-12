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

const MODEL_NAME = "gemini-2.5-flash";

const generationConfig = {
    responseMimeType: 'application/json',
    temperature: 0.4, // Slightly higher for better template understanding
    maxOutputTokens: 8000, // Increased significantly to handle large LaTeX documents
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
You are a LaTeX template expert specializing in resume templates. Your task is to generate a COMPLETE, READY-TO-COMPILE LaTeX document.

**CRITICAL UNDERSTANDING:**
The template "${templateId}" may use modular structure with \\input{} commands. You must:
1. Generate a SINGLE, COMPLETE .tex file that compiles without external dependencies
2. Replace ALL \\input{} commands with the actual content inline
3. Use the template's command structure (\\cventry, \\cvsection, etc.) exactly as shown

**TEMPLATE STRUCTURE:**
\`\`\`latex
${templateContent}
\`\`\`

**USER RESUME DATA:**
${resumeText}

**YOUR TASK:**
1. **Analyze the template**: Identify the document structure, required commands, and styling
2. **Replace modular inputs**: If you see \\input{cv-sections/experience.tex}, replace it with actual experience content using \\cventry commands
3. **Fill user data**: Use the user's resume information to populate all sections
4. **Preserve styling**: Keep all the template's formatting, colors, and command structure
5. **Generate complete file**: Output must be a single .tex file that compiles independently

**EXAMPLE TRANSFORMATION:**
If template has: \\input{cv-sections/experience.tex}
Replace with:
\`\`\`
\\cvsection{Experience}
\\begin{cventries}
\\cventry
{Software Engineer} % Job title
{Tech Company} % Organization  
{New York, NY} % Location
{Jan 2020 - Present} % Date(s)
{
\\begin{cvitems}
\\item {Developed scalable web applications using React and Node.js}
\\item {Improved system performance by 40% through optimization}
\\end{cvitems}
}
\\end{cventries}
\`\`\`

**SECTION MAPPING:**
- Experience → Use \\cventry commands with user's work history
- Education → Use \\cventry commands with user's education
- Skills → Use \\cvitemwithcomment or \\cvitem commands
- Personal Info → Fill \\name{}, \\address{}, \\email{}, etc.

**CRITICAL:** Output must be a SINGLE, COMPLETE LaTeX file that compiles without any external file dependencies.

**OPTIMIZATION NOTE:** Keep the LaTeX code clean and concise. Avoid excessive comments or redundant formatting to stay within response limits.

**JSON OUTPUT REQUIREMENTS:**
- Your response must be VALID JSON
- Properly escape all backslashes in LaTeX code (use \\\\ for each \\)
- Properly escape all quotes in LaTeX code (use \\" for each ")
- Ensure all newlines are represented as \\n
- Keep the output as concise as possible while maintaining quality

**JSON OUTPUT:**
{
  "generatedCode": "Complete, self-contained LaTeX document ready to compile with proper JSON escaping"
}
`;

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
    console.log('🔍 Raw AI Response Length:', responseJson.length);
    console.log('🔍 Raw AI Response Preview:', responseJson.substring(0, 200) + '...');
    console.log('🔍 Raw AI Response End:', '...' + responseJson.substring(responseJson.length - 200));
    
    // Check for truncation
    if (!responseJson.trim().endsWith('}')) {
      console.warn('⚠️  Response appears to be truncated - does not end with }');
    }
    
    // Sometimes the model returns markdown with the json, let's strip it.
    const sanitizedJson = responseJson.replace(/```json\n/g, '').replace(/\n```/g, '');
    console.log('🔍 Sanitized JSON Length:', sanitizedJson.length);
    console.log('🔍 Sanitized JSON Preview:', sanitizedJson.substring(0, 200) + '...');
    console.log('🔍 Sanitized JSON End:', '...' + sanitizedJson.substring(sanitizedJson.length - 200));

    let parsedResponse: LaTeXRecommendation;
    try {
      parsedResponse = JSON.parse(sanitizedJson) as LaTeXRecommendation;
      console.log('🔍 Parsed Response Keys:', Object.keys(parsedResponse));
      console.log('🔍 Generated Code Type:', typeof parsedResponse.generatedCode);
      console.log('🔍 Generated Code Length:', parsedResponse.generatedCode?.length || 'undefined');
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      console.error('❌ Failed JSON substring (around error):', sanitizedJson.substring(1100, 1200));
      
      // Check if this is a truncation issue
      if (parseError instanceof SyntaxError && parseError.message.includes('Unexpected end of JSON input')) {
        console.log('🔧 Detected JSON truncation - attempting recovery...');
        
        // Try to find the start of the generatedCode content
        const startMatch = sanitizedJson.match(/"generatedCode"\s*:\s*"/);
        if (startMatch) {
          const startIndex = startMatch.index! + startMatch[0].length;
          const codeContent = sanitizedJson.substring(startIndex);
          
          // Find the last complete line before truncation
          const lines = codeContent.split('\\n');
          const completeLines = lines.slice(0, -1); // Remove potentially incomplete last line
          const recoveredCode = completeLines.join('\n')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\')
            .replace(/\\t/g, '\t');
          
          console.log('🔧 Recovered LaTeX code length:', recoveredCode.length);
          parsedResponse = { generatedCode: recoveredCode };
          console.log('🎉 Successfully recovered truncated LaTeX code');
        } else {
          await logError(`JSON truncation recovery failed: ${parseError.message}`);
          return res.status(500).json({ error: 'The AI response was truncated. Please try again.' });
        }
      } else {
        // Try to extract the LaTeX code manually if JSON parsing fails
        const codeMatch = sanitizedJson.match(/"generatedCode"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        if (codeMatch && codeMatch[1]) {
          console.log('🔧 Attempting manual LaTeX extraction...');
          try {
            // Manually unescape the JSON string
            const extractedCode = codeMatch[1]
              .replace(/\\n/g, '\n')
              .replace(/\\t/g, '\t')
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\');
            
            parsedResponse = { generatedCode: extractedCode };
            console.log('🎉 Successfully extracted LaTeX code manually');
          } catch (extractError) {
            console.error('❌ Manual extraction failed:', extractError);
            await logError(`JSON parsing and manual extraction failed: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
            return res.status(500).json({ error: 'The AI returned an invalid response format that could not be parsed.' });
          }
        } else {
          await logError(`JSON parsing failed: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
          return res.status(500).json({ error: 'The AI returned an invalid response format.' });
        }
      }
    }

    // Validate the response structure
    if (!parsedResponse.generatedCode) {
      console.error('❌ Missing generatedCode in response:', parsedResponse);
      await logError('AI response missing generatedCode property');
      return res.status(500).json({ error: 'The AI response was incomplete. Please try again.' });
    }

    // Validate that template structure is preserved
    const originalTemplateCommands = templateContent.match(/\\[a-zA-Z]+(?=\{)/g) || [];
    const generatedCommands = parsedResponse.generatedCode.match(/\\[a-zA-Z]+(?=\{)/g) || [];
    
    console.log('🔍 Original template commands:', originalTemplateCommands.slice(0, 10));
    console.log('🔍 Generated commands:', generatedCommands.slice(0, 10));
    
    // Check if major template commands are preserved
    const majorCommands = ['\\documentclass', '\\name', '\\address', '\\position', '\\cventry', '\\section'];
    const preservedCommands = majorCommands.filter(cmd => 
      originalTemplateCommands.some(origCmd => origCmd === cmd) && 
      generatedCommands.some(genCmd => genCmd === cmd)
    );
    
    console.log('🔍 Preserved major commands:', preservedCommands);

    // A little bit of post-processing to ensure formatting is good
    parsedResponse.generatedCode = parsedResponse.generatedCode.replace(/\\ /g, ' ');
    parsedResponse.generatedCode = parsedResponse.generatedCode.replace(/\\t/g, '');

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