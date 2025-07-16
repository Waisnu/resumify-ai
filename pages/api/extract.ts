import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs/promises';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { createWorker } from 'tesseract.js';
import { incrementCounter, logError } from '@/lib/admin-stats';
import { extractRateLimiter, withRateLimit } from '@/lib/rate-limiter';

export const config = {
  api: {
    bodyParser: false,
  },
};

const formidableParse = async (req: NextApiRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
  return new Promise((resolve, reject) => {
    const form = formidable({});
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
};

const extractText = async (file: formidable.File): Promise<string> => {
  const filePath = file.filepath;
  let fileBuffer: Buffer | null = null;
  
  try {
    if (file.mimetype === 'application/pdf') {
      fileBuffer = await fs.readFile(filePath);
      const data = await pdf(fileBuffer);
      return data.text;
    }
    
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const { value } = await mammoth.extractRawText({ path: filePath });
      return value;
    }
    
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      const worker = await createWorker('eng');
      try {
        const { data: { text } } = await worker.recognize(filePath);
        return text;
      } finally {
        await worker.terminate();
      }
    }

    throw new Error('Unsupported file type.');
  } finally {
    // Clean up file buffer from memory
    if (fileBuffer) {
      fileBuffer = null;
    }
    
    // Force garbage collection hint
    if (global.gc) {
      global.gc();
    }
  }
};

async function extractHandler(
  req: NextApiRequest,
  res: NextApiResponse<{ text?: string; error?: string }>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { files } = await formidableParse(req);
    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    // Enhanced file size validation
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit
    if (uploadedFile.size > MAX_FILE_SIZE) {
      return res.status(400).json({ 
        error: `File exceeds the ${MAX_FILE_SIZE / (1024 * 1024)}MB size limit. File size: ${(uploadedFile.size / (1024 * 1024)).toFixed(2)}MB` 
      });
    }
    
    // Additional validation for empty files
    if (uploadedFile.size === 0) {
      return res.status(400).json({ error: 'Uploaded file is empty.' });
    }

    // Enhanced MIME type validation
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg',
      'image/jpg',
    ];
    
    if (!uploadedFile.mimetype || !allowedTypes.includes(uploadedFile.mimetype)) {
      return res.status(400).json({ 
        error: `Invalid file type: ${uploadedFile.mimetype}. Please upload a PDF, DOCX, PNG, or JPEG file.` 
      });
    }
    
    // Additional filename validation
    const originalName = uploadedFile.originalFilename || 'unknown';
    const suspiciousPatterns = [/\.\./, /[<>:"|?*]/, /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i];
    
    if (suspiciousPatterns.some(pattern => pattern.test(originalName))) {
      return res.status(400).json({ error: 'Invalid filename format.' });
    }

    const extractedText = await extractText(uploadedFile);

    // Clean up uploaded file immediately after processing
    try {
      await fs.unlink(uploadedFile.filepath);
    } catch (unlinkError) {
      console.warn('Failed to delete uploaded file:', unlinkError);
      // Continue processing even if file deletion fails
    }

    // Enhanced text content validation
    if (!extractedText || extractedText.trim().length < 10) {
      const errorMsg = uploadedFile.mimetype?.startsWith('image/')
        ? 'Could not extract text from the image. The image may be blurry or contain no text.'
        : 'Could not extract text from the document. It might be empty or protected.';
      
      await logError(`Text extraction failed: ${errorMsg} (File type: ${uploadedFile.mimetype}, Size: ${uploadedFile.size})`);
      return res.status(400).json({ error: errorMsg });
    }
    
    // Check for reasonable text length (resumes should have some content)
    if (extractedText.trim().length < 50) {
      return res.status(400).json({ 
        error: 'Extracted text is too short. Please ensure your resume contains sufficient content.' 
      });
    }

    // Track successful resume processing
    await incrementCounter('totalResumes');

    return res.status(200).json({ text: extractedText });

  } catch (error) {
    console.error('Error processing file upload:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    
    // Enhanced error logging with more context
    await logError(`File processing failed: ${message} (IP: ${req.socket.remoteAddress}, User-Agent: ${req.headers['user-agent']})`);
    
    // Don't expose internal error details to client
    if (message.includes('ENOENT') || message.includes('permission')) {
      return res.status(500).json({ error: 'File processing temporarily unavailable. Please try again.' });
    }
    
    return res.status(500).json({ error: 'Error processing file. Please try again with a different file.' });
  }
}

// Apply rate limiting middleware
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ text?: string; error?: string }>
) {
  const rateLimitMiddleware = withRateLimit(extractRateLimiter);
  
  await rateLimitMiddleware(req, res, async () => {
    await extractHandler(req, res);
  });
} 