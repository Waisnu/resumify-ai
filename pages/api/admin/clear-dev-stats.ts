import type { NextApiRequest, NextApiResponse } from 'next';
import { clearDevStats } from '@/lib/admin-stats';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Only available in development environment' });
  }

  try {
    await clearDevStats();
    return res.status(200).json({ message: 'Development stats cleared successfully' });
  } catch (error) {
    console.error('Failed to clear dev stats:', error);
    return res.status(500).json({ error: 'Failed to clear dev stats' });
  }
}