// Performance Monitoring Utility
// Tracks and logs performance metrics for API endpoints and key operations

import { logger } from './secure-logger';

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  success: boolean;
  timestamp: string;
  metadata?: Record<string, any>;
}

export class PerformanceMonitor {
  private static metrics: PerformanceMetrics[] = [];
  private static maxMetrics = 1000; // Keep last 1000 metrics in memory
  
  static startTiming(operation: string): { end: (success?: boolean, metadata?: Record<string, any>) => void } {
    const startTime = Date.now();
    
    return {
      end: (success: boolean = true, metadata?: Record<string, any>) => {
        const duration = Date.now() - startTime;
        const metric: PerformanceMetrics = {
          operation,
          duration,
          success,
          timestamp: new Date().toISOString(),
          metadata
        };
        
        // Add to metrics array
        this.addMetric(metric);
        
        // Log performance with appropriate level
        if (duration > 10000) {
          logger.error(`Slow operation detected: ${operation}`, { duration, success, metadata });
        } else if (duration > 5000) {
          logger.warn(`Slow operation: ${operation}`, { duration, success, metadata });
        } else {
          logger.performance(operation, duration, metadata);
        }
        
        // Log failed operations
        if (!success) {
          logger.error(`Operation failed: ${operation}`, { duration, metadata });
        }
      }
    };
  }
  
  private static addMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    
    // Keep only the last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }
  
  static getMetrics(operation?: string): PerformanceMetrics[] {
    if (operation) {
      return this.metrics.filter(m => m.operation === operation);
    }
    return [...this.metrics];
  }
  
  static getAveragePerformance(operation: string): {
    averageDuration: number;
    successRate: number;
    totalCalls: number;
  } {
    const metrics = this.getMetrics(operation);
    
    if (metrics.length === 0) {
      return { averageDuration: 0, successRate: 0, totalCalls: 0 };
    }
    
    const totalDuration = metrics.reduce((sum, m) => sum + m.duration, 0);
    const successCount = metrics.filter(m => m.success).length;
    
    return {
      averageDuration: totalDuration / metrics.length,
      successRate: (successCount / metrics.length) * 100,
      totalCalls: metrics.length
    };
  }
  
  static getSlowOperations(threshold: number = 1000): PerformanceMetrics[] {
    return this.metrics.filter(m => m.duration > threshold);
  }
  
  static getFailedOperations(): PerformanceMetrics[] {
    return this.metrics.filter(m => !m.success);
  }
  
  static clearMetrics(): void {
    this.metrics = [];
  }
  
  static getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    slowOperations: number;
    failedOperations: number;
    averageResponseTime: number;
  } {
    const recentMetrics = this.metrics.slice(-100); // Last 100 operations
    
    if (recentMetrics.length === 0) {
      return {
        status: 'healthy',
        slowOperations: 0,
        failedOperations: 0,
        averageResponseTime: 0
      };
    }
    
    const slowOperations = recentMetrics.filter(m => m.duration > 5000).length;
    const failedOperations = recentMetrics.filter(m => !m.success).length;
    const averageResponseTime = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (failedOperations > 10 || slowOperations > 20 || averageResponseTime > 10000) {
      status = 'unhealthy';
    } else if (failedOperations > 5 || slowOperations > 10 || averageResponseTime > 5000) {
      status = 'degraded';
    }
    
    return {
      status,
      slowOperations,
      failedOperations,
      averageResponseTime
    };
  }
}

// Decorator function for automatic performance monitoring
export function monitored(operation: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const timer = PerformanceMonitor.startTiming(`${operation}.${propertyKey}`);
      
      try {
        const result = await originalMethod.apply(this, args);
        timer.end(true);
        return result;
      } catch (error) {
        timer.end(false, { error: error instanceof Error ? error.message : String(error) });
        throw error;
      }
    };
    
    return descriptor;
  };
}

// Express middleware for API performance monitoring
export function apiPerformanceMiddleware(operation: string) {
  return (req: any, res: any, next: any) => {
    const timer = PerformanceMonitor.startTiming(operation);
    
    // Override res.json to capture response
    const originalJson = res.json;
    res.json = function(data: any) {
      const isSuccess = res.statusCode < 400;
      timer.end(isSuccess, {
        statusCode: res.statusCode,
        method: req.method,
        endpoint: req.url
      });
      return originalJson.call(this, data);
    };
    
    next();
  };
}

export default PerformanceMonitor;