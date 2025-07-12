import type { NextApiRequest, NextApiResponse } from 'next';
import { activeTokens } from './login';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.body.token || 
                  req.headers['x-admin-token'];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    if (!activeTokens.has(token)) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Token is valid' 
    });

  } catch (error) {
    console.error('Admin verify error:', error);
    return res.status(500).json({ error: 'Verification failed' });
  }
} 