import type { NextApiRequest, NextApiResponse } from 'next';
import { PerformanceMonitor } from '@/lib/performance-monitor';
import { validateMethod } from '@/lib/error-handler';
import { logger } from '@/lib/secure-logger';

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  performance: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    slowOperations: number;
    failedOperations: number;
    averageResponseTime: number;
  };
  environment: string;
  dependencies: {
    geminiAI: boolean;
    database: boolean;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthCheckResponse>
) {
  try {
    validateMethod(req, ['GET']);
    
    const startTime = Date.now();
    
    // Get performance metrics
    const performanceStatus = PerformanceMonitor.getHealthStatus();
    
    // Check dependencies
    const dependencies = {
      geminiAI: !!process.env.GEMINI_API_KEY,
      database: true // We're using file-based storage, so always true
    };
    
    // Calculate overall status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (performanceStatus.status === 'unhealthy' || !dependencies.geminiAI) {
      overallStatus = 'unhealthy';
    } else if (performanceStatus.status === 'degraded') {
      overallStatus = 'degraded';
    }
    
    const healthResponse: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      performance: performanceStatus,
      environment: process.env.NODE_ENV || 'development',
      dependencies
    };
    
    // Log health check
    logger.info('Health check performed', {
      status: overallStatus,
      responseTime: Date.now() - startTime,
      performance: performanceStatus
    });
    
    // Set appropriate HTTP status
    const httpStatus = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503;
    
    res.status(httpStatus).json(healthResponse);
    
  } catch (error) {
    logger.error('Health check failed', { error: error instanceof Error ? error.message : String(error) });
    
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      performance: {
        status: 'unhealthy',
        slowOperations: 0,
        failedOperations: 0,
        averageResponseTime: 0
      },
      environment: process.env.NODE_ENV || 'development',
      dependencies: {
        geminiAI: false,
        database: false
      }
    });
  }
}