import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

// Server-side admin password (NOT exposed to client)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) {
  throw new Error('ADMIN_PASSWORD environment variable is required for security');
}

// Simple token storage (in production, use Redis or database)
const activeTokens = new Set<string>();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    if (password !== ADMIN_PASSWORD) {
      // Add a small delay to prevent brute force attacks
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Generate a secure token
    const token = crypto.randomBytes(32).toString('hex');
    activeTokens.add(token);

    // Clean up old tokens with proper expiration (enhanced security)
    if (activeTokens.size > 5) {
      const tokensArray = Array.from(activeTokens);
      tokensArray.slice(0, 3).forEach(oldToken => activeTokens.delete(oldToken));
    }
    
    // Set token expiration (12 hours)
    setTimeout(() => {
      activeTokens.delete(token);
    }, 12 * 60 * 60 * 1000);

    return res.status(200).json({ 
      success: true, 
      token,
      message: 'Authentication successful' 
    });

  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}

// Export for use in other admin endpoints
export { activeTokens }; 