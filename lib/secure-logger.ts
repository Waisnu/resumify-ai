// Secure Logging Utility
// Prevents sensitive data exposure in logs

interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

const LOG_LEVELS: LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

// Sensitive data patterns to sanitize
const SENSITIVE_PATTERNS = [
  /api[_-]?key[s]?/i,
  /auth[_-]?token[s]?/i,
  /password[s]?/i,
  /secret[s]?/i,
  /credential[s]?/i,
  /bearer\s+/i,
  /authorization/i,
  /x-api-key/i,
  /gemini[_-]?api[_-]?key/i,
  /google[_-]?ai[_-]?key/i,
  /openai[_-]?api[_-]?key/i
];

// Email and personal info patterns
const PII_PATTERNS = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
  /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
  /\b\d{3}-\d{3}-\d{4}\b/g, // Phone
  /\b\d{16}\b/g, // Credit card
];

/**
 * Sanitizes sensitive data from logs
 */
function sanitizeData(data: any): any {
  if (typeof data === 'string') {
    let sanitized = data;
    
    // Replace sensitive patterns
    SENSITIVE_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });
    
    // Replace PII patterns
    PII_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });
    
    return sanitized;
  }
  
  if (typeof data === 'object' && data !== null) {
    if (Array.isArray(data)) {
      return data.map(item => sanitizeData(item));
    }
    
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      // Check if key contains sensitive information
      const keyLower = key.toLowerCase();
      const isSensitiveKey = SENSITIVE_PATTERNS.some(pattern => pattern.test(keyLower));
      
      if (isSensitiveKey) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeData(value);
      }
    }
    
    return sanitized;
  }
  
  return data;
}

/**
 * Secure logger class with sanitization
 */
export class SecureLogger {
  private static isDevelopment = process.env.NODE_ENV === 'development';
  private static isProduction = process.env.NODE_ENV === 'production';
  
  private static formatMessage(level: string, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const sanitizedData = data ? sanitizeData(data) : undefined;
    
    return {
      timestamp,
      level: level.toUpperCase(),
      message,
      data: sanitizedData,
      environment: process.env.NODE_ENV || 'development'
    };
  }
  
  static error(message: string, data?: any) {
    const logData = this.formatMessage(LOG_LEVELS.ERROR, message, data);
    
    if (this.isDevelopment) {
      console.error('🚨 ERROR:', logData);
    } else if (this.isProduction) {
      // In production, use structured logging
      console.error(JSON.stringify(logData));
    }
  }
  
  static warn(message: string, data?: any) {
    const logData = this.formatMessage(LOG_LEVELS.WARN, message, data);
    
    if (this.isDevelopment) {
      console.warn('⚠️ WARN:', logData);
    } else if (this.isProduction) {
      console.warn(JSON.stringify(logData));
    }
  }
  
  static info(message: string, data?: any) {
    const logData = this.formatMessage(LOG_LEVELS.INFO, message, data);
    
    if (this.isDevelopment) {
      console.info('ℹ️ INFO:', logData);
    } else if (this.isProduction) {
      console.info(JSON.stringify(logData));
    }
  }
  
  static debug(message: string, data?: any) {
    // Only log debug messages in development
    if (this.isDevelopment) {
      const logData = this.formatMessage(LOG_LEVELS.DEBUG, message, data);
      console.debug('🔍 DEBUG:', logData);
    }
  }
  
  static api(endpoint: string, method: string, statusCode: number, data?: any) {
    const message = `API ${method.toUpperCase()} ${endpoint} - ${statusCode}`;
    const logData = this.formatMessage(LOG_LEVELS.INFO, message, {
      endpoint,
      method: method.toUpperCase(),
      statusCode,
      ...data
    });
    
    if (this.isDevelopment) {
      const emoji = statusCode >= 400 ? '🚨' : statusCode >= 300 ? '⚠️' : '✅';
      console.log(`${emoji} ${message}`, logData);
    } else if (this.isProduction) {
      console.log(JSON.stringify(logData));
    }
  }
  
  static performance(operation: string, duration: number, data?: any) {
    const message = `Performance: ${operation} took ${duration}ms`;
    const logData = this.formatMessage(LOG_LEVELS.INFO, message, {
      operation,
      duration,
      ...data
    });
    
    if (this.isDevelopment) {
      const emoji = duration > 5000 ? '🐌' : duration > 1000 ? '⏱️' : '⚡';
      console.log(`${emoji} ${message}`, logData);
    } else if (this.isProduction) {
      console.log(JSON.stringify(logData));
    }
  }
}

// Convenience exports
export const logger = SecureLogger;
export default SecureLogger;