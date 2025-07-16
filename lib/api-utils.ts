// API Utility Functions
// Common patterns and utilities used across API endpoints

import { NextApiRequest, NextApiResponse } from 'next';
import { ValidationError, handleApiError, validateMethod, validateRequiredFields } from './error-handler';
import { PerformanceMonitor } from './performance-monitor';
import { logger } from './secure-logger';

export interface ApiConfig {
  operation: string;
  allowedMethods: string[];
  requiredFields?: string[];
  validateInput?: (body: any) => void;
  skipPerformanceMonitoring?: boolean;
}

/**
 * Higher-order function to wrap API handlers with common functionality
 */
export function withApiHandler<T = any>(
  config: ApiConfig,
  handler: (req: NextApiRequest, res: NextApiResponse<T>) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse<T>) => {
    const timer = config.skipPerformanceMonitoring 
      ? null 
      : PerformanceMonitor.startTiming(config.operation);
    
    try {
      // Validate HTTP method
      validateMethod(req, config.allowedMethods);
      
      // Validate required fields
      if (config.requiredFields && config.requiredFields.length > 0) {
        validateRequiredFields(req.body, config.requiredFields);
      }
      
      // Custom input validation
      if (config.validateInput) {
        config.validateInput(req.body);
      }
      
      // Log request start
      logger.info(`${config.operation} started`, {
        method: req.method,
        endpoint: req.url,
        userAgent: req.headers['user-agent']
      });
      
      // Execute the handler
      await handler(req, res);
      
      // Log success
      logger.info(`${config.operation} completed successfully`);
      
      // End performance timer
      if (timer) {
        timer.end(true, { 
          statusCode: res.statusCode,
          method: req.method 
        });
      }
      
    } catch (error) {
      // Log error
      logger.error(`${config.operation} failed`, {
        error: error instanceof Error ? error.message : String(error),
        method: req.method,
        endpoint: req.url
      });
      
      // End performance timer with failure
      if (timer) {
        timer.end(false, { 
          error: error instanceof Error ? error.message : String(error),
          method: req.method 
        });
      }
      
      // Handle error
      await handleApiError(error, req, res, config.operation);
    }
  };
}

/**
 * Common validation patterns
 */
export const validators = {
  string: (value: any, fieldName: string) => {
    if (typeof value !== 'string') {
      throw new ValidationError(`${fieldName} must be a string`);
    }
  },
  
  stringNonEmpty: (value: any, fieldName: string) => {
    validators.string(value, fieldName);
    if (!value.trim()) {
      throw new ValidationError(`${fieldName} cannot be empty`);
    }
  },
  
  email: (value: any, fieldName: string) => {
    validators.string(value, fieldName);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new ValidationError(`${fieldName} must be a valid email address`);
    }
  },
  
  oneOf: (value: any, options: string[], fieldName: string) => {
    if (!options.includes(value)) {
      throw new ValidationError(`${fieldName} must be one of: ${options.join(', ')}`);
    }
  },
  
  number: (value: any, fieldName: string) => {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new ValidationError(`${fieldName} must be a valid number`);
    }
  },
  
  integer: (value: any, fieldName: string) => {
    validators.number(value, fieldName);
    if (!Number.isInteger(value)) {
      throw new ValidationError(`${fieldName} must be an integer`);
    }
  },
  
  positiveNumber: (value: any, fieldName: string) => {
    validators.number(value, fieldName);
    if (value <= 0) {
      throw new ValidationError(`${fieldName} must be a positive number`);
    }
  },
  
  boolean: (value: any, fieldName: string) => {
    if (typeof value !== 'boolean') {
      throw new ValidationError(`${fieldName} must be a boolean`);
    }
  },
  
  array: (value: any, fieldName: string) => {
    if (!Array.isArray(value)) {
      throw new ValidationError(`${fieldName} must be an array`);
    }
  },
  
  object: (value: any, fieldName: string) => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new ValidationError(`${fieldName} must be an object`);
    }
  }
};

/**
 * Common response builders
 */
export const responses = {
  success: <T>(data: T, message?: string) => ({
    success: true,
    data,
    message: message || 'Operation completed successfully',
    timestamp: new Date().toISOString()
  }),
  
  error: (message: string, code?: string) => ({
    success: false,
    error: {
      message,
      code: code || 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString()
    }
  }),
  
  paginated: <T>(data: T[], page: number, limit: number, total: number) => ({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    },
    timestamp: new Date().toISOString()
  })
};

/**
 * Common middleware patterns
 */
export const middleware = {
  cors: (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    next();
  },
  
  rateLimit: (windowMs: number, max: number) => {
    const requests = new Map<string, number[]>();
    
    return (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
      const clientId = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
      const now = Date.now();
      const windowStart = now - windowMs;
      
      if (!requests.has(clientId as string)) {
        requests.set(clientId as string, []);
      }
      
      const clientRequests = requests.get(clientId as string)!;
      
      // Remove old requests
      const validRequests = clientRequests.filter(time => time > windowStart);
      
      if (validRequests.length >= max) {
        res.status(429).json(responses.error('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED'));
        return;
      }
      
      validRequests.push(now);
      requests.set(clientId as string, validRequests);
      
      next();
    };
  }
};

/**
 * Utility to compose multiple middlewares
 */
export function compose(...middlewares: Array<(req: NextApiRequest, res: NextApiResponse, next: () => void) => void>) {
  return (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
    let index = 0;
    
    function dispatch() {
      if (index >= middlewares.length) {
        next();
        return;
      }
      
      const middleware = middlewares[index++];
      middleware(req, res, dispatch);
    }
    
    dispatch();
  };
}

export default {
  withApiHandler,
  validators,
  responses,
  middleware,
  compose
};