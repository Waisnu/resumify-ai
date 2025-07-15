import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import path from 'path';
import fs from 'fs/promises';
import { incrementCounter, logError, trackTokenUsage } from '@/lib/admin-stats';

// --- Advanced API Key Manager with Load Balancing and Rate Limiting ---
class APIKeyManager {
  private apiKeys: string[];
  private clients: GoogleGenerativeAI[];
  private keyMetrics: Map<string, {
    requests: number;
    errors: number;
    lastUsed: number;
    rateLimitReset: number;
    isHealthy: boolean;
  }>;
  private requestQueue: Array<{
    resolve: (client: GoogleGenerativeAI) => void;
    reject: (error: Error) => void;
    timestamp: number;
  }>;
  private processingQueue: boolean;
  
  constructor() {
    this.apiKeys = (process.env.GEMINI_API_KEYS || '').split(',').map(key => key.trim()).filter(Boolean);
    
    if (this.apiKeys.length === 0) {
      throw new Error('GEMINI_API_KEYS is not set or empty in environment variables.');
    }
    
    this.clients = this.apiKeys.map(key => new GoogleGenerativeAI(key));
    this.keyMetrics = new Map();
    this.requestQueue = [];
    this.processingQueue = false;
    
    // Initialize metrics for each key
    this.apiKeys.forEach(key => {
      this.keyMetrics.set(key, {
        requests: 0,
        errors: 0,
        lastUsed: 0,
        rateLimitReset: 0,
        isHealthy: true
      });
    });
    
    // Start health check interval - less frequent to save API calls
    setInterval(() => this.performHealthCheck(), 300000); // Check every 5 minutes
  }
  
  // Get the best available client with intelligent load balancing
  async getClient(): Promise<GoogleGenerativeAI> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ resolve, reject, timestamp: Date.now() });
      this.processQueue();
    });
  }
  
  private async processQueue() {
    if (this.processingQueue || this.requestQueue.length === 0) return;
    
    this.processingQueue = true;
    
    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (!request) break;
      
      // Check if request is too old (timeout after 30 seconds)
      if (Date.now() - request.timestamp > 30000) {
        request.reject(new Error('Request timeout'));
        continue;
      }
      
      try {
        const client = await this.selectBestClient();
        request.resolve(client);
      } catch (error) {
        request.reject(error instanceof Error ? error : new Error('Unknown error'));
      }
    }
    
    this.processingQueue = false;
  }
  
  private async selectBestClient(): Promise<GoogleGenerativeAI> {
    const now = Date.now();
    const availableKeys = this.apiKeys.filter(key => {
      const metrics = this.keyMetrics.get(key)!;
      return metrics.isHealthy && now > metrics.rateLimitReset;
    });
    
    if (availableKeys.length === 0) {
      // Check if any keys will be available soon
      const nextAvailable = Math.min(...Array.from(this.keyMetrics.values())
        .map(m => m.rateLimitReset));
      
      if (nextAvailable > now) {
        // Wait for the next available key
        await new Promise(resolve => setTimeout(resolve, nextAvailable - now + 100));
        return this.selectBestClient();
      }
      
      throw new Error('No healthy API keys available');
    }
    
    // Select key with least recent usage and lowest error rate
    const bestKey = availableKeys.reduce((best, current) => {
      const bestMetrics = this.keyMetrics.get(best)!;
      const currentMetrics = this.keyMetrics.get(current)!;
      
      const bestScore = bestMetrics.errors / Math.max(bestMetrics.requests, 1) + 
                       (now - bestMetrics.lastUsed) / 1000;
      const currentScore = currentMetrics.errors / Math.max(currentMetrics.requests, 1) + 
                          (now - currentMetrics.lastUsed) / 1000;
      
      return currentScore > bestScore ? current : best;
    });
    
    const keyIndex = this.apiKeys.indexOf(bestKey);
    const metrics = this.keyMetrics.get(bestKey)!;
    
    // Update metrics
    metrics.requests++;
    metrics.lastUsed = now;
    
    console.log(`🔑 Using API Key #${keyIndex + 1} (Requests: ${metrics.requests}, Errors: ${metrics.errors})`);
    
    return this.clients[keyIndex];
  }
  
  // Record successful request
  recordSuccess(client: GoogleGenerativeAI) {
    const keyIndex = this.clients.indexOf(client);
    if (keyIndex !== -1) {
      const key = this.apiKeys[keyIndex];
      const metrics = this.keyMetrics.get(key)!;
      metrics.isHealthy = true;
    }
  }
  
  // Record error and handle rate limiting
  recordError(client: GoogleGenerativeAI, error: unknown) {
    const keyIndex = this.clients.indexOf(client);
    if (keyIndex !== -1) {
      const key = this.apiKeys[keyIndex];
      const metrics = this.keyMetrics.get(key)!;
      metrics.errors++;
      
      // Check if it's a rate limit error
      if (error instanceof Error && (error.message?.includes('429') || error.message?.includes('quota'))) {
        metrics.rateLimitReset = Date.now() + 60000; // Wait 1 minute
        console.log(`⚠️ Rate limit hit for API Key #${keyIndex + 1}, cooling down for 60 seconds`);
      }
      
      // Mark as unhealthy if too many errors
      if (metrics.errors > 5) {
        metrics.isHealthy = false;
        console.log(`❌ API Key #${keyIndex + 1} marked as unhealthy due to excessive errors`);
      }
    }
  }
  
  // Perform health check on all keys
  private async performHealthCheck() {
    // Only log if there are actually unhealthy keys
    const unhealthyKeys = Array.from(this.keyMetrics.values()).filter(m => !m.isHealthy).length;
    if (unhealthyKeys > 0) {
      console.log(`🔍 API key health check: ${unhealthyKeys} unhealthy keys found`);
    }
    
    for (let i = 0; i < this.apiKeys.length; i++) {
      const key = this.apiKeys[i];
      const metrics = this.keyMetrics.get(key)!;
      
      // Reset error count periodically (more conservative)
      if (Date.now() - metrics.lastUsed > 600000) { // 10 minutes
        metrics.errors = Math.max(0, metrics.errors - 1);
        if (metrics.errors <= 2) {
          metrics.isHealthy = true;
        }
      }
      
      // Reset rate limit after longer period
      if (Date.now() > metrics.rateLimitReset + 60000) { // 1 minute buffer
        metrics.rateLimitReset = 0;
      }
    }
  }
  
  // Get current status for monitoring
  getStatus() {
    return {
      totalKeys: this.apiKeys.length,
      healthyKeys: Array.from(this.keyMetrics.values()).filter(m => m.isHealthy).length,
      queueLength: this.requestQueue.length,
      metrics: Array.from(this.keyMetrics.entries()).map(([key, metrics], index) => ({
        keyIndex: index + 1,
        requests: metrics.requests,
        errors: metrics.errors,
        isHealthy: metrics.isHealthy,
        rateLimitReset: metrics.rateLimitReset
      }))
    };
  }
}

const apiKeyManager = new APIKeyManager();
// ----------------------------

const MODEL_NAME = "gemini-2.5-pro";

const generationConfig = {
    responseMimeType: 'text/plain',
    temperature: 0.1, // Very low for maximum accuracy and consistency
    maxOutputTokens: 32000, // Increased for complex templates
    topP: 0.7, // More focused generation
    topK: 20, // Lower for more deterministic output
    candidateCount: 1, // Single candidate for consistency
};

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// --- Resilient AI Generation with Smart Failover ---
async function generateWithFailover(prompt: string, maxRetries = 3) {
  let attempts = 0;
  let lastError: Error | null = null;
  
  while (attempts < maxRetries) {
    let client: GoogleGenerativeAI | null = null;
    
    try {
      // Get the best available client from our intelligent manager
      client = await apiKeyManager.getClient();
      const model = client.getGenerativeModel({ model: MODEL_NAME });
      
      console.log(`🚀 LaTeX Generation Attempt ${attempts + 1}/${maxRetries} with ${MODEL_NAME}`);
      
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
        safetySettings,
      });
      
      // Record success for this client
      apiKeyManager.recordSuccess(client);
      
      console.log(`✅ LaTeX generation succeeded on attempt ${attempts + 1}`);
      return result;
      
    } catch (error) {
      attempts++;
      lastError = error instanceof Error ? error : new Error('Unknown API error');
      
      // Record error for this client if we have one
      if (client) {
        apiKeyManager.recordError(client, lastError);
      }
      
      console.warn(`❌ LaTeX generation attempt ${attempts} failed: ${lastError.message}`);
      await logError(`LaTeX generation attempt ${attempts} failed: ${lastError.message}`);
      
      // If this was our last attempt, break out of the loop
      if (attempts >= maxRetries) {
        break;
      }
      
      // Wait a bit before retrying (exponential backoff)
      const waitTime = Math.min(1000 * Math.pow(2, attempts - 1), 5000);
      console.log(`⏳ Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  // If we get here, all attempts failed
  console.error(`💥 All ${maxRetries} LaTeX generation attempts failed`);
  
  // Log final error
  await logError(`All LaTeX generation attempts failed. Last error: ${lastError?.message || 'Unknown error'}`);
  
  // Throw a user-friendly error
  if (lastError?.message.includes('503') || lastError?.message.includes('overloaded')) {
    throw new Error('The AI service is currently overloaded. Please try again in a few moments.');
  }
  
  if (lastError?.message.includes('quota') || lastError?.message.includes('429')) {
    throw new Error('API rate limit exceeded. Please try again later.');
  }
  
  throw new Error('All AI models are currently unavailable for LaTeX generation. Please try again later.');
}

// Advanced LaTeX cleaning and validation function
function cleanAndValidateLatex(code: string, templateId: string): string {
  let cleanedCode = code;
  
  // Step 1: Basic character cleaning and text coherence fixes
  cleanedCode = cleanedCode
    // Remove problematic characters
    .replace(/\\t/g, '')
    .replace(/\t/g, ' ')
    // Fix smart quotes and dashes
    .replace(/'/g, "'")
    .replace(/'/g, "'")
    .replace(/"/g, '"')
    .replace(/"/g, '"')
    .replace(/–/g, '--')
    .replace(/—/g, '---')
    // Remove zero-width spaces and other invisible characters
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // Normalize whitespace
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Clean up multiple blank lines
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    // Fix text fragmentation issues - merge broken words
    .replace(/([a-zA-Z])\s*\n\s*([a-z])/g, '$1$2')
    // Fix broken sentences and paragraphs
    .replace(/([a-zA-Z,.])\s*\n\s*([a-z])/g, '$1 $2')
    // Clean up excessive whitespace in parameter blocks
    .replace(/\{\s*\n\s*([^}]+)\s*\n\s*\}/g, '{$1}')
    // Fix broken LaTeX commands
    .replace(/\\\s*([a-zA-Z]+)/g, '\\$1');

  // Step 2: Template-specific fixes
  switch (templateId) {
    case 'medium-length-professional-cv':
      cleanedCode = cleanedCode
        // Fix standard LaTeX formatting issues
        .replace(/\\\\([a-zA-Z]+)/g, '\\$1')
        .replace(/\\/g, '\\')
        // Ensure proper section formatting
        .replace(/\\section\{([^}]+)\}/g, '\\section{$1}')
        .replace(/\\subsection\{([^}]+)\}/g, '\\subsection{$1}')
        // Fix itemize environments
        .replace(/\\begin\{itemize\}\s*\\item/g, '\\begin{itemize}\\n\\item')
        .replace(/\\item([^\\])/g, '\\item $1')
        // Clean up spacing
        .replace(/\n\s*\n\s*\n/g, '\n\n');
      break;
      
    case 'faang-cv':
      cleanedCode = cleanedCode
        // CRITICAL: Replace ALL section commands with rSection
        .replace(/\\section\s*\{([^}]+)\}/g, '\\begin{rSection}{$1}\\n\\n\\end{rSection}')
        .replace(/\\subsection\s*\{([^}]+)\}/g, '\\begin{rSection}{$1}\\n\\n\\end{rSection}')
        // Fix role formatting with proper spacing
        .replace(/\\textbf\s*\{([^}]+)\}\s*\\hfill\s*([^\\]+)\\/g, '\\textbf{$1} \\hfill $2\\')
        // Fix company and location formatting
        .replace(/([A-Za-z\s&,.]+)\s*\\hfill\s*\\textit\s*\{([^}]+)\}/g, '$1 \\hfill \\textit{$2}')
        // Ensure proper itemize structure with correct spacing
        .replace(/\\begin\s*\{itemize\}/g, ' \\begin{itemize}')
        .replace(/\\begin\{itemize\}\s*\\itemsep\s*-3pt\s*\{\}\s*/g, ' \\begin{itemize}\\n    \\itemsep -3pt {} \\n')
        .replace(/\\item\s+/g, '     \\item ')
        .replace(/\\end\s*\{itemize\}/g, ' \\end{itemize}')
        // Fix common FAANG section names
        .replace(/\\begin\{rSection\}\s*\{OBJECTIVE\}/g, '\\begin{rSection}{OBJECTIVE}')
        .replace(/\\begin\{rSection\}\s*\{EXPERIENCE\}/g, '\\begin{rSection}{EXPERIENCE}')
        .replace(/\\begin\{rSection\}\s*\{SKILLS\}/g, '\\begin{rSection}{SKILLS}')
        .replace(/\\begin\{rSection\}\s*\{PROJECTS\}/g, '\\begin{rSection}{PROJECTS}')
        .replace(/\\begin\{rSection\}\s*\{Education\}/g, '\\begin{rSection}{Education}')
        // Clean up rSection structure with proper spacing
        .replace(/\\begin\{rSection\}\s*\{([^}]+)\}\s*([\s\S]*?)\\end\{rSection\}/g, 
                 '\\begin{rSection}{$1}\\n\\n$2\\n\\end{rSection}')
        // Fix itemize formatting inside rSection
        .replace(/(\s+)\\item\s*/g, '$1\\item ')
        // Clean up excessive spacing
        .replace(/\n\s*\n\s*\n/g, '\n\n');
      break;
      
    default:
      // Generic fixes for other templates
      cleanedCode = cleanedCode
        .replace(/\\/g, '\\');
  }
  
  // Step 3: General LaTeX syntax validation and fixes
  cleanedCode = cleanedCode
    // Fix common command issues
    .replace(/\\begin\{\s*([^}]+)\s*\}/g, '\\begin{$1}')
    .replace(/\\end\{\s*([^}]+)\s*\}/g, '\\end{$1}')
    // Fix spacing around commands
    .replace(/\\([a-zA-Z]+)\s*\{/g, '\\$1{')
    // Fix parameter formatting
    .replace(/\{\s*([^}]+)\s*\}/g, '{$1}')
    // Remove extra spaces before closing braces
    .replace(/\s+\}/g, '}')
    // Fix newlines around sections
    .replace(/\\section\{/g, '\n\\section{')
    .replace(/\\subsection\{/g, '\n\\subsection{')
    .replace(/\\cvsection\{/g, '\n\\cvsection{')
    .replace(/\\cvsect\{/g, '\n\\cvsect{')
    // Clean up final formatting
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
  
  // Step 4: Validate critical LaTeX structure
  const criticalChecks = [
    /\\documentclass/,
    /\\begin\{document\}/,
    /\\end\{document\}/
  ];
  
  for (const check of criticalChecks) {
    if (!check.test(cleanedCode)) {
      console.warn(`⚠️ LaTeX validation warning: Missing ${check.source}`);
    }
  }
  
  // Step 5: Template-specific validation and final cleanup
  switch (templateId) {
    case 'medium-length-professional-cv': {
      if (!cleanedCode.includes('\\documentclass') || !cleanedCode.includes('\\begin{document}')) {
        console.warn('⚠️ Professional CV validation: Missing basic document structure');
      }
      
      // Validate section structure
      const sectionMatches = cleanedCode.match(/\\section\{[^}]+\}/g);
      if (sectionMatches) {
        console.log(`✅ Found ${sectionMatches.length} sections in professional CV`);
      }
      
      // Final cleanup for professional cv
      cleanedCode = cleanedCode
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        .replace(/\\section\{([^}]+)\}/g, '\n\\section{$1}\n')
        .replace(/\\subsection\{([^}]+)\}/g, '\n\\subsection{$1}\n');
      break;
    }
      
    case 'faang-cv': {
      if (!cleanedCode.includes('\\begin{rSection}') || !cleanedCode.includes('\\end{rSection}')) {
        console.warn('⚠️ FAANG CV validation: Missing rSection structure');
      }
      
      // Check for forbidden LaTeX sections
      if (cleanedCode.includes('\\section{') || cleanedCode.includes('\\subsection{')) {
        console.warn('⚠️ FAANG CV error: Contains forbidden \\section or \\subsection commands');
      }
      
      // Validate rSection usage
      const rSectionMatches = cleanedCode.match(/\\begin\{rSection\}\{[^}]+\}/g);
      if (rSectionMatches) {
        console.log(`✅ Found ${rSectionMatches.length} rSection environments in FAANG CV`);
        
        // Check for common FAANG sections
        const expectedSections = ['OBJECTIVE', 'Education', 'SKILLS', 'EXPERIENCE', 'PROJECTS'];
        expectedSections.forEach(section => {
          if (!cleanedCode.includes(`{${section}}`)) {
            console.warn(`⚠️ FAANG CV missing expected section: ${section}`);
          }
        });
      }
      
      // Validate itemize structure
      const itemizeMatches = cleanedCode.match(/\\begin\{itemize\}[^}]*\\itemsep\s*-3pt\s*\{\}/g);
      if (itemizeMatches) {
        console.log(`✅ Found ${itemizeMatches.length} properly formatted itemize environments`);
      } else {
        console.warn('⚠️ FAANG CV: Missing or improperly formatted itemize environments');
      }
      
      // Final cleanup for FAANG cv
      cleanedCode = cleanedCode
        .replace(/\\begin\{rSection\}\s*\{([^}]+)\}/g, '\\begin{rSection}{$1}')
        .replace(/\\textbf\{([^}]+)\}\s*\\hfill/g, '\\textbf{$1} \\hfill')
        .replace(/\\itemsep\s*-3pt\s*\{\}/g, '\\itemsep -3pt {}')
        // Ensure proper spacing around rSection
        .replace(/\\end\{rSection\}\s*\\begin\{rSection\}/g, '\\end{rSection}\\n\\n\\begin{rSection}')
        // Fix common spacing issues
        .replace(/\\\s*\\/g, '\\')
        .replace(/\s+\\hfill/g, ' \\hfill')
        .replace(/\\hfill\s+/g, '\\hfill ');
      break;
    }
  }
  
  return cleanedCode;
}
// ------------------------------------------

const buildPrompt = (resumeText: string, templateContent: string, templateId: string) => {
  // Enhanced template-specific detailed instructions with examples
  const templateInstructions = {
    'medium-length-professional-cv': {
      commands: '\\section{Section Name}, \\subsection{Subsection}',
      structure: 'Standard LaTeX article structure with custom resume.cls',
      personalInfo: 'Name, address, phone, email at top using template format',
      sections: 'Experience, Education, Skills, Projects, etc.',
      critical: 'Use standard LaTeX sectioning commands. Professional formatting throughout. Follow template structure exactly.',
      example: `\\section{Professional Experience}
\\subsection{Senior Software Engineer, Tech Company Inc. (2020--Present)}
Led development of scalable web applications using modern technologies.`
    },
    'faang-cv': {
      commands: '\\begin{rSection}{SECTION NAME} and \\textbf{Role Name}',
      structure: 'Uses rSection environment for all sections. NO standard LaTeX sections.',
      personalInfo: '\\name{FirstName LastName} and \\address{} commands at top',
      sections: 'OBJECTIVE, Education, SKILLS, EXPERIENCE, PROJECTS, Extra-Curricular Activities, Leadership',
      critical: 'CRITICAL: NEVER use \\section{} or \\subsection{}. ALWAYS use \\begin{rSection}{NAME}...\\end{rSection}. Use \\textbf{} for job titles. Use \\hfill for dates. Use itemize with \\itemsep -3pt {}. Follow FAANG resume format exactly.',
      example: `\\begin{rSection}{EXPERIENCE}

\\textbf{Software Engineer} \\hfill Jan 2020 - Present\\\\
Company Name \\hfill \\textit{San Francisco, CA}
 \\begin{itemize}
    \\itemsep -3pt {} 
     \\item Achieved 40\\% performance improvement using React and Node.js
     \\item Led team of 5 developers in agile development practices
 \\end{itemize}

\\end{rSection}`
    }
  };

  const instruction = templateInstructions[templateId] || templateInstructions['medium-length-professional-cv'];

  return `You are a world-class LaTeX expert and technical writer. Your task is to generate a perfect, professional LaTeX document with ZERO errors.

🔥 CRITICAL SUCCESS REQUIREMENTS:
1. NEVER break words across lines artificially
2. NEVER create typos or formatting errors
3. ALWAYS use complete, coherent sentences
4. ALWAYS follow the exact template structure
5. ALWAYS use proper LaTeX syntax

🎯 TEMPLATE: ${templateId.toUpperCase()}
${instruction.critical}

📋 COMMANDS AND STRUCTURE:
- Primary commands: ${instruction.commands}
- Document structure: ${instruction.structure}
- Personal information: ${instruction.personalInfo}
- Section organization: ${instruction.sections}

📖 EXAMPLE FORMAT:
${instruction.example}

🚫 ABSOLUTE PROHIBITIONS:
- NO fragmented text or broken words
- NO typos or spelling errors
- NO incorrect command syntax
- NO markdown formatting (code blocks etc.)
- NO explanatory text outside LaTeX
- NO incomplete entries or sections

✅ QUALITY CHECKLIST:
1. All text flows naturally and coherently
2. All commands use correct parameter counts
3. All sections are complete and well-formatted
4. All personal information is properly structured
5. All dates, titles, and descriptions are clear
6. Document compiles without errors

🎨 TEMPLATE TO FOLLOW EXACTLY:
${templateContent}

📄 USER'S RESUME INFORMATION:
${resumeText}

🎯 GENERATE A COMPLETE, PERFECT LaTeX DOCUMENT NOW:`;
}

type LaTeXRecommendation = {
  generatedCode: string;
};

// Map template IDs to their file paths for security and convenience
const templateFileMap: { [key: string]: string } = {
  'medium-length-professional-cv': 'LaTeXTemplates_medium-length-professional-cv_v3.0/template.tex',
  'faang-cv': 'LatexTemplates_FAANG/resume_faangpath.tex',
};

const inlineImports = async (filePath: string, content: string): Promise<string> => {
  const importRegex = /\\input\{(.+?)\}/g;
  let inlinedContent = content;
  const fileDir = path.dirname(filePath);

  // Use Promise.all to handle multiple imports concurrently
  const promises = [];
  const matches = [...content.matchAll(importRegex)];

  for (const match of matches) {
    const importPath = match[1];
    // Ensure the path ends with .tex for consistency
    const relativePath = importPath.endsWith('.tex') ? importPath : `${importPath}.tex`;
    const absolutePath = path.resolve(fileDir, relativePath);
    
    promises.push(
      (async () => {
        try {
          const importedContent = await fs.readFile(absolutePath, 'utf-8');
          // Recursively inline imports within the imported file
          const recursivelyInlined = await inlineImports(absolutePath, importedContent);
          // Replace the original \input command with the processed content
          inlinedContent = inlinedContent.replace(match[0], recursivelyInlined);
        } catch (error) {
          console.warn(`⚠️ Could not read or inline import: ${absolutePath}. It will be left as is in the template.`);
          await logError(`LaTeX import failed for template ${filePath}: could not read ${absolutePath}`);
        }
      })()
    );
  }

  await Promise.all(promises);
  return inlinedContent;
};


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ recommendation?: LaTeXRecommendation; error?: string; status?: object }>
) {
  // Health check endpoint for monitoring API key manager
  if (req.method === 'GET' && req.query.status === 'true') {
    try {
      const managerStatus = apiKeyManager.getStatus();
      return res.status(200).json({
        status: {
          ...managerStatus,
          model: MODEL_NAME,
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          healthy: managerStatus.healthyKeys > 0
        }
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to get API key manager status' });
    }
  }
  
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, GET');
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

    // --- Inline LaTeX Imports ---
    const inlinedTemplateContent = await inlineImports(templatePath, templateContent);
    // --------------------------

    const prompt = buildPrompt(resumeText, inlinedTemplateContent, templateId);
    
    console.log(`📝 Calling Gemini API for LaTeX generation with model: ${MODEL_NAME}`);
    const result = await generateWithFailover(prompt);

    const responseJson = result.response.text();
    console.log('🔍 Raw AI Response Length:', responseJson.length);
    console.log('🔍 Raw AI Response Preview:', responseJson.substring(0, 200) + '...');
    console.log('🔍 Raw AI Response End:', '...' + responseJson.substring(responseJson.length - 200));
    
    // Extract only the LaTeX content - no explanations or context
    let generatedCode = responseJson.trim();
    
    // Remove any AI explanations or context before LaTeX code
    const latexStartMarkers = ['\\documentclass', '%', '\\begin{document}'];
    let latexStart = -1;
    
    for (const marker of latexStartMarkers) {
      const pos = generatedCode.indexOf(marker);
      if (pos !== -1 && (latexStart === -1 || pos < latexStart)) {
        latexStart = pos;
      }
    }
    
    if (latexStart > 0) {
      generatedCode = generatedCode.substring(latexStart);
    }
    
    // Remove any markdown code blocks
    generatedCode = generatedCode
      .replace(/```latex\n?/g, '')
      .replace(/```\n?/g, '')
      .replace(/^```/g, '')
      .replace(/```$/g, '');
    
    // Remove any AI explanations at the end
    const latexEndMarkers = ['\\end{document}'];
    let latexEnd = -1;
    
    for (const marker of latexEndMarkers) {
      const pos = generatedCode.lastIndexOf(marker);
      if (pos !== -1) {
        latexEnd = pos + marker.length;
        break;
      }
    }
    
    if (latexEnd !== -1) {
      generatedCode = generatedCode.substring(0, latexEnd);
    }
    
    // Advanced LaTeX cleaning and validation
    generatedCode = cleanAndValidateLatex(generatedCode, templateId);
    
    // Basic validation - ensure it looks like LaTeX
    if (!generatedCode.includes('\\documentclass') || !generatedCode.includes('\\begin{document}')) {
      console.error('❌ Generated code does not appear to be valid LaTeX');
      await logError('AI response missing essential LaTeX structure');
      return res.status(500).json({ error: 'The AI generated invalid LaTeX code. Please try again.' });
    }

    // Create response object
    const parsedResponse: LaTeXRecommendation = { generatedCode };
    
    console.log('🔍 Generated Code Length:', generatedCode.length);
    console.log('🔍 Generated Code Preview:', generatedCode.substring(0, 300) + '...');

    // Validate that template structure is preserved
    const originalTemplateCommands = inlinedTemplateContent.match(/[a-zA-Z]+(?=\{)/g) || [];
    const generatedCommands = generatedCode.match(/[a-zA-Z]+(?=\{)/g) || [];
    
    console.log('🔍 Original template commands:', originalTemplateCommands.slice(0, 10));
    console.log('🔍 Generated commands:', generatedCommands.slice(0, 10));
    
    // Check if major template commands are preserved
    const majorCommands = ['\\documentclass', '\\name', '\\address', '\\position', '\\cventry', '\\section'];
    const preservedCommands = majorCommands.filter(cmd => 
      originalTemplateCommands.some(origCmd => origCmd === cmd) && 
      generatedCommands.some(genCmd => genCmd === cmd)
    );
    
    console.log('🔍 Preserved major commands:', preservedCommands);

    // Final LaTeX code validation and cleanup
    generatedCode = generatedCode
      // Fix spacing issues
      .replace(/\\ /g, ' ')
      .replace(/\\t/g, '')
      // Ensure proper line endings
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Fix common LaTeX formatting issues
      .replace(/\\/g, '\\')
      // Ensure proper section formatting
      .replace(/\\section\s*\{([^}]+)\}/g, '\\section{$1}')
      // Fix common command spacing
      .replace(/\\item\s+/g, '\\item ')
      // Remove extra whitespace
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
    
    // Ensure the document ends properly
    if (!generatedCode.endsWith('\\end{document}')) {
      if (generatedCode.includes('\\begin{document}')) {
        generatedCode += '\n\\end{document}';
      }
    }

    console.log('🎉 Improved LaTeX Recommendation generated successfully');
    
    // Track token usage for monitoring
    const estimatedTokens = Math.ceil((resumeText.length + inlinedTemplateContent.length + generatedCode.length) / 4);
    await trackTokenUsage('latex', estimatedTokens, MODEL_NAME);
    
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
      if (error.message.includes('unavailable')) {
        return res.status(503).json({ error: 'The AI service is temporarily unavailable. Please try again later.' });
      }
    }
    
    return res.status(500).json({ error: 'Failed to generate recommendation due to an unexpected error.' });
  }
} 