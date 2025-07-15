// User Feedback System
// Simple JSON-based feedback storage for MVP

import fs from 'fs/promises';
import path from 'path';

interface UserFeedback {
  id: string;
  message: string;
  rating?: number;
  timestamp: string;
  userAgent?: string;
  ipAddress?: string;
  email?: string;
  name?: string;
}

interface FeedbackData {
  feedbacks: UserFeedback[];
  totalCount: number;
  lastUpdated: string;
}

// Use different files for dev and prod environments
const isDevelopment = process.env.NODE_ENV === 'development';
const FEEDBACK_FILE = path.join(process.cwd(), isDevelopment ? 'feedback-dev.json' : 'feedback.json');

export async function getFeedbacks(): Promise<FeedbackData> {
  try {
    const data = await fs.readFile(FEEDBACK_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return default structure
    return {
      feedbacks: [],
      totalCount: 0,
      lastUpdated: new Date().toISOString()
    };
  }
}

export async function addFeedback(feedback: Omit<UserFeedback, 'id' | 'timestamp'>): Promise<UserFeedback> {
  try {
    const feedbackData = await getFeedbacks();
    
    const newFeedback: UserFeedback = {
      ...feedback,
      id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };
    
    feedbackData.feedbacks.unshift(newFeedback); // Add to beginning
    feedbackData.totalCount = feedbackData.feedbacks.length;
    feedbackData.lastUpdated = new Date().toISOString();
    
    // Keep only last 1000 feedbacks to prevent file from growing too large
    if (feedbackData.feedbacks.length > 1000) {
      feedbackData.feedbacks = feedbackData.feedbacks.slice(0, 1000);
    }
    
    await fs.writeFile(FEEDBACK_FILE, JSON.stringify(feedbackData, null, 2));
    
    console.log('💬 New feedback received:', feedback.message.substring(0, 100) + '...');
    
    return newFeedback;
  } catch (error) {
    console.error('Failed to save feedback:', error);
    throw error;
  }
}

export async function getRecentFeedbacks(limit: number = 50): Promise<UserFeedback[]> {
  try {
    const feedbackData = await getFeedbacks();
    return feedbackData.feedbacks.slice(0, limit);
  } catch (error) {
    console.error('Failed to get recent feedbacks:', error);
    return [];
  }
}