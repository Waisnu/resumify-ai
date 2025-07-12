import type { NextApiRequest, NextApiResponse } from 'next';
import { getStats } from '@/lib/admin-stats';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const stats = await getStats();
    return res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return res.status(500).json({ error: 'Failed to fetch statistics' });
  }
} 