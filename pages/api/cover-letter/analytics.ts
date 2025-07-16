import type { NextApiRequest, NextApiResponse } from 'next';
import { incrementCounter, logError } from '@/lib/admin-stats';
import { ValidationError, handleApiError, validateMethod, validateRequiredFields } from '@/lib/error-handler';
import { withRateLimit, adminRateLimiter } from '@/lib/rate-limiter';
import { ProFeatures } from '@/lib/cover-letter-types';
import { logger } from '@/lib/secure-logger';

// Mock analytics data - in production, this would come from a database
const mockAnalytics: ProFeatures['analytics'] = {
  successRate: 85.2,
  commonSuggestions: [
    "Include more specific achievements and metrics",
    "Better align skills with job requirements",
    "Strengthen the opening paragraph",
    "Add more personalized company research",
    "Improve call-to-action effectiveness"
  ],
  industryBenchmarks: {
    "technology": 88.5,
    "healthcare": 82.1,
    "finance": 79.8,
    "marketing": 86.3,
    "education": 84.7,
    "consulting": 87.9,
    "retail": 76.4,
    "manufacturing": 81.2
  },
  performanceMetrics: {
    avgScore: 4.2,
    avgWordCount: 387,
    avgReadTime: 1.9
  }
};

// Cover letter performance tracking
interface CoverLetterPerformance {
  id: string;
  score: number;
  wordCount: number;
  industry: string;
  template: string;
  createdAt: string;
  feedback?: {
    helpful: boolean;
    rating: number;
    comments?: string;
  };
}

// Mock performance data
const mockPerformanceData: CoverLetterPerformance[] = [
  {
    id: "cl_1",
    score: 4.5,
    wordCount: 425,
    industry: "technology",
    template: "tech-focused",
    createdAt: "2024-01-15T10:30:00Z",
    feedback: { helpful: true, rating: 5, comments: "Great personalization!" }
  },
  {
    id: "cl_2",
    score: 3.8,
    wordCount: 380,
    industry: "marketing",
    template: "modern-creative",
    createdAt: "2024-01-14T15:45:00Z",
    feedback: { helpful: true, rating: 4 }
  },
  {
    id: "cl_3",
    score: 4.2,
    wordCount: 340,
    industry: "finance",
    template: "professional-standard",
    createdAt: "2024-01-13T09:20:00Z",
    feedback: { helpful: false, rating: 3, comments: "Could be more specific" }
  }
];

// Analytics calculation functions
function calculateSuccessRate(performances: CoverLetterPerformance[]): number {
  const successful = performances.filter(p => p.score >= 4.0).length;
  return (successful / performances.length) * 100;
}

function getCommonSuggestions(performances: CoverLetterPerformance[]): string[] {
  // In a real implementation, this would analyze actual suggestion data
  return mockAnalytics.commonSuggestions;
}

function calculateIndustryBenchmarks(performances: CoverLetterPerformance[]): Record<string, number> {
  const industryGroups = performances.reduce((acc, p) => {
    if (!acc[p.industry]) acc[p.industry] = [];
    acc[p.industry].push(p.score);
    return acc;
  }, {} as Record<string, number[]>);

  const benchmarks: Record<string, number> = {};
  Object.entries(industryGroups).forEach(([industry, scores]) => {
    benchmarks[industry] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  });

  return benchmarks;
}

function calculatePerformanceMetrics(performances: CoverLetterPerformance[]) {
  const avgScore = performances.reduce((sum, p) => sum + p.score, 0) / performances.length;
  const avgWordCount = performances.reduce((sum, p) => sum + p.wordCount, 0) / performances.length;
  const avgReadTime = avgWordCount / 200; // Assuming 200 words per minute

  return {
    avgScore: Math.round(avgScore * 10) / 10,
    avgWordCount: Math.round(avgWordCount),
    avgReadTime: Math.round(avgReadTime * 10) / 10
  };
}

async function analyticsHandler(
  req: NextApiRequest,
  res: NextApiResponse<{ analytics?: ProFeatures['analytics']; error?: string }>
) {
  try {
    validateMethod(req, ['GET']);
    const { timeRange = '30d', industry } = req.query;

    // Validate query parameters
    if (timeRange && !['7d', '30d', '90d', '1y'].includes(timeRange as string)) {
      throw new ValidationError('Invalid time range. Must be one of: 7d, 30d, 90d, 1y');
    }

    // Filter performance data based on query parameters
    let filteredData = [...mockPerformanceData];

    if (industry && typeof industry === 'string') {
      filteredData = filteredData.filter(p => p.industry === industry);
    }

    // Calculate analytics based on filtered data
    const analytics: ProFeatures['analytics'] = {
      successRate: calculateSuccessRate(filteredData),
      commonSuggestions: getCommonSuggestions(filteredData),
      industryBenchmarks: calculateIndustryBenchmarks(mockPerformanceData), // Use all data for benchmarks
      performanceMetrics: calculatePerformanceMetrics(filteredData)
    };

    // Track analytics request
    // await incrementCounter('analyticsRequests'); // TODO: Add to admin stats

    logger.info('Analytics requested', { timeRange, industry });
    
    return res.status(200).json({ analytics });

  } catch (error) {
    await handleApiError(error, req, res, 'Analytics request');
  }
}

// Export analytics data submission endpoint
export async function submitFeedback(
  req: NextApiRequest,
  res: NextApiResponse<{ success?: boolean; error?: string }>
) {
  try {
    validateMethod(req, ['POST']);
    const { coverLetterId, helpful, rating, comments } = req.body;

    // Validate input
    if (!coverLetterId || typeof coverLetterId !== 'string') {
      throw new ValidationError('Cover letter ID is required');
    }

    if (typeof helpful !== 'boolean') {
      throw new ValidationError('Helpful field must be a boolean');
    }

    if (rating && (typeof rating !== 'number' || rating < 1 || rating > 5)) {
      throw new ValidationError('Rating must be a number between 1 and 5');
    }

    // In production, save to database
    logger.info('Feedback received', { coverLetterId, helpful, rating, hasComments: !!comments });

    // Track feedback submission
    // await incrementCounter('feedbackSubmissions'); // TODO: Add to admin stats

    return res.status(200).json({ success: true });

  } catch (error) {
    await handleApiError(error, req, res, 'Feedback submission');
  }
}

// Export user performance summary
interface UserPerformanceSummary {
  totalCoverLetters: number;
  averageScore: number;
  successRate: number;
  improvementTrend: string;
  topIndustries: string[];
  templatePreferences: Record<string, number>;
  recentActivity: Array<{
    date: string;
    score: number;
    company: string;
  }>;
}

export async function getPerformanceSummary(
  req: NextApiRequest,
  res: NextApiResponse<{ summary?: UserPerformanceSummary; error?: string }>
) {
  try {
    validateMethod(req, ['GET']);
    const { userId } = req.query;

    // In production, fetch user-specific data
    const userPerformance = {
      totalCoverLetters: 12,
      averageScore: 4.1,
      successRate: 83.3,
      improvementTrend: '+12% this month',
      topIndustries: ['technology', 'marketing', 'finance'],
      templatePreferences: {
        'tech-focused': 5,
        'modern-creative': 4,
        'professional-standard': 3
      },
      recentActivity: [
        { date: '2024-01-15', score: 4.5, company: 'Google' },
        { date: '2024-01-14', score: 3.8, company: 'Meta' },
        { date: '2024-01-13', score: 4.2, company: 'Apple' }
      ]
    };

    return res.status(200).json({ summary: userPerformance });

  } catch (error) {
    await handleApiError(error, req, res, 'Performance summary');
  }
}

// Apply rate limiting
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const rateLimitMiddleware = withRateLimit(adminRateLimiter);
  
  await rateLimitMiddleware(req, res, async () => {
    await analyticsHandler(req, res);
  });
}