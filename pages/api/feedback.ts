import type { NextApiRequest, NextApiResponse } from 'next';
import { addFeedback, getFeedbacks } from '@/lib/feedback';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    try {
      const { message, rating, email, name } = req.body;
      
      if (!message || typeof message !== 'string' || message.trim().length < 5) {
        return res.status(400).json({ 
          error: 'Message is required and must be at least 5 characters long' 
        });
      }
      
      if (message.length > 1000) {
        return res.status(400).json({ 
          error: 'Message must be less than 1000 characters' 
        });
      }
      
      // Extract basic info for analytics
      const userAgent = req.headers['user-agent'] || 'Unknown';
      const ipAddress = req.headers['x-forwarded-for'] || 
                       req.headers['x-real-ip'] || 
                       req.socket.remoteAddress || 
                       'Unknown';
      
      const feedback = await addFeedback({
        message: message.trim(),
        rating: rating && typeof rating === 'number' ? Math.max(1, Math.min(5, rating)) : undefined,
        email: email && typeof email === 'string' ? email.trim() : undefined,
        name: name && typeof name === 'string' ? name.trim() : undefined,
        userAgent,
        ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress
      });
      
      return res.status(201).json({ 
        success: true, 
        feedback: {
          id: feedback.id,
          message: feedback.message,
          timestamp: feedback.timestamp
        }
      });
      
    } catch (error) {
      console.error('Failed to save feedback:', error);
      return res.status(500).json({ 
        error: 'Failed to save feedback. Please try again.' 
      });
    }
  } else if (req.method === 'GET') {
    // Admin endpoint to get feedbacks
    try {
      const feedbackData = await getFeedbacks();
      return res.status(200).json(feedbackData);
    } catch (error) {
      console.error('Failed to get feedbacks:', error);
      return res.status(500).json({ 
        error: 'Failed to retrieve feedbacks' 
      });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }
}