import type { NextApiRequest, NextApiResponse } from 'next';
import { calculateDailyCapacity } from '@/lib/admin-stats';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const capacity = await calculateDailyCapacity();
    return res.status(200).json(capacity);
  } catch (error) {
    console.error('Error calculating capacity:', error);
    return res.status(500).json({ error: 'Failed to calculate capacity' });
  }
} 