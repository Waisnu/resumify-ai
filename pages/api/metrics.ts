import type { NextApiRequest, NextApiResponse } from 'next';
import { PerformanceMonitor } from '@/lib/performance-monitor';
import { validateMethod, AuthorizationError } from '@/lib/error-handler';
import { logger } from '@/lib/secure-logger';

interface MetricsResponse {
  timestamp: string;
  performance: {
    averagePerformance: Record<string, {
      averageDuration: number;
      successRate: number;
      totalCalls: number;
    }>;
    slowOperations: any[];
    failedOperations: any[];
    healthStatus: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      slowOperations: number;
      failedOperations: number;
      averageResponseTime: number;
    };
  };
  system: {
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    environment: string;
  };
}

// Simple authorization check (in production, use proper authentication)
function isAuthorized(req: NextApiRequest): boolean {
  const authHeader = req.headers.authorization;
  const apiKey = process.env.ADMIN_API_KEY;
  
  if (!apiKey) {
    return process.env.NODE_ENV === 'development';
  }
  
  return authHeader === `Bearer ${apiKey}`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MetricsResponse | { error: string }>
) {
  try {
    validateMethod(req, ['GET']);
    
    // Check authorization
    if (!isAuthorized(req)) {
      throw new AuthorizationError('Unauthorized access to metrics endpoint');
    }
    
    const startTime = Date.now();
    
    // Get performance metrics for key operations
    const operations = [
      'cover-letter-generation',
      'latex-generation',
      'resume-analysis',
      'api-request'
    ];
    
    const averagePerformance: Record<string, any> = {};
    for (const operation of operations) {
      averagePerformance[operation] = PerformanceMonitor.getAveragePerformance(operation);
    }
    
    const metricsResponse: MetricsResponse = {
      timestamp: new Date().toISOString(),
      performance: {
        averagePerformance,
        slowOperations: PerformanceMonitor.getSlowOperations(1000),
        failedOperations: PerformanceMonitor.getFailedOperations(),
        healthStatus: PerformanceMonitor.getHealthStatus()
      },
      system: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development'
      }
    };
    
    // Log metrics request
    logger.info('Metrics accessed', {
      responseTime: Date.now() - startTime,
      userAgent: req.headers['user-agent']
    });
    
    res.status(200).json(metricsResponse);
    
  } catch (error) {
    logger.error('Metrics request failed', { 
      error: error instanceof Error ? error.message : String(error),
      userAgent: req.headers['user-agent']
    });
    
    if (error instanceof AuthorizationError) {
      res.status(401).json({ error: 'Unauthorized' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}