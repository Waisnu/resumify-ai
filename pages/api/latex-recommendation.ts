import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// --- Smart API Key Manager ---
const apiKeys = (process.env.GEMINI_API_KEYS || '').split(',').filter(Boolean);
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
    temperature: 0.5,
};

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];


// LaTeX Template Definitions (simplified, as the AI will generate the full code)
const LATEX_TEMPLATES = {
  softwareEngineer: `\\documentclass{resume}
\\usepackage[left=0.4 in,top=0.4in,right=0.4 in,bottom=0.4in]{geometry}
\\newcommand{\\tab}[1]{\\hspace{.2667\\textwidth}\\rlap{#1}} 
\\newcommand{\\itab}[1]{\\hspace{0em}\\rlap{#1}}
\\name{[NAME]}
\\address{[PHONE] \\\\ [LOCATION]}
\\address{[EMAIL] \\\\ [LINKEDIN] \\\\ [GITHUB] \\\\ [PORTFOLIO]}

\\begin{document}

\\begin{rSection}{OBJECTIVE}
{[OBJECTIVE]}
\\end{rSection}

\\begin{rSection}{Education}
[EDUCATION]
\\end{rSection}

\\begin{rSection}{SKILLS}
\\begin{tabular}{ @{} >{\\bfseries}l @{\\hspace{6ex}} l }
Programming Languages & [PROGRAMMING_LANGUAGES]\\\\
Frameworks & [FRAMEWORKS]\\\\
Tools & [TOOLS]\\\\
\\end{tabular}\\\\
\\end{rSection}

\\begin{rSection}{EXPERIENCE}
[EXPERIENCE]
\\end{rSection}

\\begin{rSection}{PROJECTS}
[PROJECTS]
\\end{rSection}

\\end{document}`,
  dataScientist: `\\documentclass{resume}
\\usepackage[left=0.4 in,top=0.4in,right=0.4 in,bottom=0.4in]{geometry}
\\newcommand{\\tab}[1]{\\hspace{.2667\\textwidth}\\rlap{#1}} 
\\newcommand{\\itab}[1]{\\hspace{0em}\\rlap{#1}}
\\name{[NAME]}
\\address{[PHONE] \\\\ [LOCATION]}
\\address{[EMAIL] \\\\ [LINKEDIN] \\\\ [GITHUB]}

\\begin{document}

\\begin{rSection}{OBJECTIVE}
{[OBJECTIVE]}
\\end{rSection}

\\begin{rSection}{Education}
[EDUCATION]
\\end{rSection}

\\begin{rSection}{TECHNICAL SKILLS}
\\begin{tabular}{ @{} >{\\bfseries}l @{\\hspace{6ex}} l }
Programming & [PROGRAMMING_LANGUAGES]\\\\
Data Science & [DATA_SCIENCE_TOOLS]\\\\
Machine Learning & [ML_FRAMEWORKS]\\\\
Databases & [DATABASES]\\\\
Visualization & [VISUALIZATION_TOOLS]\\\\
\\end{tabular}\\\\
\\end{rSection}

\\begin{rSection}{EXPERIENCE}
[EXPERIENCE]
\\end{rSection}

\\begin{rSection}{RESEARCH \& PROJECTS}
[PROJECTS]
\\end{rSection}

\\end{document}`,
  productManager: `\\documentclass{resume}
\\usepackage[left=0.4 in,top=0.4in,right=0.4 in,bottom=0.4in]{geometry}
\\newcommand{\\tab}[1]{\\hspace{.2667\\textwidth}\\rlap{#1}} 
\\newcommand{\\itab}[1]{\\hspace{0em}\\rlap{#1}}
\\name{[NAME]}
\\address{[PHONE] \\\\ [LOCATION]}
\\address{[EMAIL] \\\\ [LINKEDIN]}

\\begin{document}

\\begin{rSection}{SUMMARY}
{[OBJECTIVE]}
\\end{rSection}

\\begin{rSection}{Education}
[EDUCATION]
\\end{rSection}

\\begin{rSection}{CORE COMPETENCIES}
\\begin{tabular}{ @{} >{\\bfseries}l @{\\hspace{6ex}} l }
Product Strategy & [PRODUCT_STRATEGY]\\\\
Analytics & [ANALYTICS_TOOLS]\\\\
Technical Skills & [TECHNICAL_SKILLS]\\\\
Leadership & [LEADERSHIP_SKILLS]\\\\
\\end{tabular}\\\\
\\end{rSection}

\\begin{rSection}{EXPERIENCE}
[EXPERIENCE]
\\end{rSection}

\\begin{rSection}{ACHIEVEMENTS \& IMPACT}
[ACHIEVEMENTS]
\\end{rSection}

\\end{document}`
};

const buildPrompt = (resumeText: string) => `
You are a world-class career coach and expert LaTeX resume creator. Your task is to analyze the provided resume text and generate a complete, professional LaTeX resume based on the best-fitting template.

**ANALYSIS & GENERATION STEPS:**

1.  **Analyze the Resume**: Carefully read the following resume text to understand the candidate's profile, experience, skills, and career focus.
    \`\`\`
    ${resumeText}
    \`\`\`

2.  **Select the Best Template**: Based on your analysis, choose the most appropriate template from the following options:
    *   \`softwareEngineer\`: For software engineering, web/mobile development, or other technical coding roles.
    *   \`dataScientist\`: For roles in data science, machine learning, analytics, and business intelligence.
    *   \`productManager\`: For product management, project management, or business-focused roles.

3.  **Generate the LaTeX Code**:
    *   Use the standard resume.cls format (like the provided FAANG example).
    *   Populate the chosen template with the user's information extracted from the resume text.
    *   Replace ALL placeholders like [NAME], [EMAIL], [EXPERIENCE] etc., with the actual information.
    *   Format experience, education, and projects professionally. Use \\textbf for titles, \\hfill for dates/locations, and \\item for bullet points.
    *   Ensure the generated code is clean, complete, and ready to be compiled in an editor like Overleaf.

4.  **Provide Improvement Suggestions**: Based on the resume content, provide 3-5 specific, actionable suggestions for how the user could improve their resume content. Focus on quantifying achievements, using stronger action verbs, and tailoring content to target roles.

**JSON OUTPUT SPECIFICATION:**

Your entire response MUST be a single, valid JSON object. Do NOT include any text, markdown, or commentary outside of this JSON object.

The JSON object must have the following structure:
\`\`\`json
{
  "recommendedTemplate": "softwareEngineer" | "dataScientist" | "productManager",
  "confidence": <number between 0.0 and 1.0>,
  "reasoning": "<string: A brief, one-sentence explanation for why you chose the template>",
  "generatedCode": "<string: The complete, ready-to-compile LaTeX code>",
  "suggestions": [
    "<string: suggestion 1>",
    "<string: suggestion 2>",
    ...
  ]
}
\`\`\`

Begin your analysis now and provide the complete JSON response.
`;

type LaTeXRecommendation = {
  recommendedTemplate: keyof typeof LATEX_TEMPLATES;
  confidence: number;
  reasoning: string;
  generatedCode: string;
  suggestions: string[];
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
    const { resumeText } = req.body;

    if (!resumeText) {
      return res.status(400).json({ error: 'Resume text is required' });
    }

    const genAI = getAIClient();
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const prompt = buildPrompt(resumeText);

    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
        safetySettings
    });

    const responseJson = result.response.text();
    const parsedResponse = JSON.parse(responseJson) as LaTeXRecommendation;

    console.log('🎉 LaTeX Recommendation generated successfully');
    return res.status(200).json({ recommendation: parsedResponse });

  } catch (error) {
    console.error('❌ Error generating LaTeX recommendation with Gemini API:', error);
     if (error instanceof Error) {
        if (error.message.includes('503') || error.message.includes('overloaded')) {
            return res.status(503).json({ error: 'The AI model is currently overloaded. Please try again in a few moments.' });
        }
        if (error.message.includes('JSON')) {
            return res.status(500).json({ error: 'The AI returned an invalid response. Please try again.' });
        }
    }
    return res.status(500).json({ error: 'Failed to generate recommendation due to an unexpected error.' });
  }
} 