import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs/promises';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { createWorker } from 'tesseract.js';
import { incrementCounter, logError } from '@/lib/admin-stats';

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
  
  if (file.mimetype === 'application/pdf') {
    const fileBuffer = await fs.readFile(filePath);
    const data = await pdf(fileBuffer);
    return data.text;
  }
  
  if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const { value } = await mammoth.extractRawText({ path: filePath });
    return value;
  }
  
  if (file.mimetype && file.mimetype.startsWith('image/')) {
    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(filePath);
    await worker.terminate();
    return text;
  }

  throw new Error('Unsupported file type.');
};

export default async function handler(
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

    if (uploadedFile.size > 5 * 1024 * 1024) { // 5MB limit
      return res.status(400).json({ error: 'File exceeds the 5MB size limit.' });
    }

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg',
      'image/jpg',
    ];
    if (!uploadedFile.mimetype || !allowedTypes.includes(uploadedFile.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type. Please upload a PDF, DOCX, or image file.' });
    }

    const extractedText = await extractText(uploadedFile);

    await fs.unlink(uploadedFile.filepath);

    if (!extractedText.trim()) {
      const errorMsg = uploadedFile.mimetype.startsWith('image/')
        ? 'Could not extract text from the image. The image may be blurry or contain no text.'
        : 'Could not extract text from the document. It might be empty or protected.';
      
      await logError(`Text extraction failed: ${errorMsg} (File type: ${uploadedFile.mimetype})`);
      return res.status(400).json({ error: errorMsg });
    }

    // Track successful resume processing
    await incrementCounter('totalResumes');

    return res.status(200).json({ text: extractedText });

  } catch (error) {
    console.error('Error processing file upload:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    
    // Log the error for admin tracking
    await logError(`File processing failed: ${message}`);
    
    return res.status(500).json({ error: `Error processing file: ${message}` });
  }
} 