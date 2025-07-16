import { NextApiRequest, NextApiResponse } from 'next';
import React from 'react';
import { logError } from './admin-stats';
import { logger } from './secure-logger';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

export class ValidationError extends Error {
  statusCode = 400;
  code = 'VALIDATION_ERROR';
  isOperational = true;

  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends Error {
  statusCode = 429;
  code = 'RATE_LIMIT_ERROR';
  isOperational = true;

  constructor(message: string = 'Rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class AIServiceError extends Error {
  statusCode = 503;
  code = 'AI_SERVICE_ERROR';
  isOperational = true;

  constructor(message: string) {
    super(message);
    this.name = 'AIServiceError';
  }
}

export interface ErrorResponse {
  error: {
    message: string;
    code: string;
    statusCode: number;
    timestamp: string;
    requestId?: string;
    stack?: string;
  };
}

export async function handleApiError(
  error: unknown,
  req: NextApiRequest,
  res: NextApiResponse,
  context?: string
): Promise<void> {
  const appError = error as AppError;
  const statusCode = appError.statusCode || 500;
  const errorCode = appError.code || 'UNKNOWN_ERROR';
  const errorMessage = appError.message || 'Unknown error occurred';
  
  // Generate request ID for tracking
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Log error with context using secure logger
  const logContext = context ? `${context}: ` : '';
  logger.error(`${logContext}${errorMessage}`, {
    statusCode,
    errorCode,
    requestId,
    endpoint: req.url,
    method: req.method,
    userAgent: req.headers['user-agent'],
    stack: appError.stack
  });
  
  // Also log to admin stats for legacy compatibility
  await logError(`${logContext}${errorMessage} (RequestID: ${requestId}, Endpoint: ${req.url})`);
  
  // Don't expose internal errors in production
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const errorResponse: ErrorResponse = {
    error: {
      message: isProduction && statusCode === 500 ? 'Internal server error' : errorMessage,
      code: errorCode,
      statusCode,
      timestamp: new Date().toISOString(),
      requestId,
      ...(isDevelopment && { stack: appError.stack })
    }
  };
  
  res.status(statusCode).json(errorResponse);
}

export function createErrorHandler(context: string) {
  return async (error: unknown, req: NextApiRequest, res: NextApiResponse) => {
    await handleApiError(error, req, res, context);
  };
}

// Utility function to validate environment variables
export function validateEnvVar(name: string, fallback?: string): string {
  const value = process.env[name];
  
  if (!value) {
    if (fallback !== undefined) {
      console.warn(`Environment variable ${name} not set, using fallback`);
      return fallback;
    }
    throw new Error(`Required environment variable ${name} is not set`);
  }
  
  return value;
}

// Enhanced error boundary for React components
export function withErrorBoundary<T extends Record<string, unknown>>(
  Component: React.ComponentType<T>,
  fallback?: React.ComponentType<{ error: Error }>
) {
  return function ErrorBoundaryWrapper(props: T) {
    const [error, setError] = React.useState<Error | null>(null);
    
    React.useEffect(() => {
      const handleError = (event: ErrorEvent) => {
        setError(new Error(event.message));
      };
      
      window.addEventListener('error', handleError);
      return () => window.removeEventListener('error', handleError);
    }, []);
    
    if (error) {
      if (fallback) {
        const FallbackComponent = fallback;
        return React.createElement(FallbackComponent, { error });
      }
      
      return React.createElement('div', { className: 'error-boundary' }, [
        React.createElement('h2', { key: 'title' }, 'Something went wrong'),
        React.createElement('p', { key: 'message' }, error.message)
      ]);
    }
    
    return React.createElement(Component, props);
  };
}


export class AuthenticationError extends Error {
  statusCode = 401;
  code = 'AUTHENTICATION_ERROR';
  isOperational = true;

  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  statusCode = 403;
  code = 'AUTHORIZATION_ERROR';
  isOperational = true;

  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

// Enhanced validation helper
export function validateRequiredFields(data: Record<string, any>, requiredFields: string[]): void {
  const missing = requiredFields.filter(field => !data[field] || data[field] === '');
  if (missing.length > 0) {
    throw new ValidationError(`Missing required fields: ${missing.join(', ')}`);
  }
}

// Method validation helper
export function validateMethod(req: NextApiRequest, allowedMethods: string[]): void {
  if (!req.method || !allowedMethods.includes(req.method)) {
    throw new ValidationError(`Method ${req.method} not allowed. Allowed methods: ${allowedMethods.join(', ')}`);
  }
}