// Configuration Management
// Centralized configuration with validation and type safety

import { validateEnvVar } from './error-handler';

export interface AppConfig {
  // Environment
  nodeEnv: 'development' | 'production' | 'test';
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
  
  // AI Services
  geminiApiKey: string;
  geminiModel: string;
  
  // Rate Limiting
  rateLimitWindow: number;
  rateLimitMax: number;
  rateLimitWindowMs: number;
  
  // Performance
  maxTokens: number;
  requestTimeout: number;
  
  // Admin
  adminApiKey?: string;
  
  // Application
  appName: string;
  appVersion: string;
  
  // URLs
  baseUrl: string;
  apiUrl: string;
}

/**
 * Load and validate configuration
 */
function loadConfig(): AppConfig {
  const nodeEnv = (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test';
  
  return {
    // Environment
    nodeEnv,
    isDevelopment: nodeEnv === 'development',
    isProduction: nodeEnv === 'production',
    isTest: nodeEnv === 'test',
    
    // AI Services
    geminiApiKey: validateEnvVar('GEMINI_API_KEY'),
    geminiModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
    
    // Rate Limiting
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '10'),
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    
    // Performance
    maxTokens: parseInt(process.env.MAX_TOKENS || '4096'),
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '30000'),
    
    // Admin
    adminApiKey: process.env.ADMIN_API_KEY,
    
    // Application
    appName: process.env.APP_NAME || 'ResumeAI',
    appVersion: process.env.npm_package_version || '1.0.0',
    
    // URLs
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    apiUrl: process.env.API_URL || 'http://localhost:3000/api'
  };
}

// Export singleton configuration
export const config = loadConfig();

// Type-safe configuration access
export const getConfig = () => config;

// Environment helpers
export const env = {
  isDevelopment: config.isDevelopment,
  isProduction: config.isProduction,
  isTest: config.isTest,
  nodeEnv: config.nodeEnv
};

// Feature flags
export const features = {
  enableAnalytics: config.isProduction,
  enableDebugLogs: config.isDevelopment,
  enableRateLimiting: true,
  enablePerformanceMonitoring: true,
  enableSecureLogging: true
};

// API configuration
export const api = {
  gemini: {
    apiKey: config.geminiApiKey,
    model: config.geminiModel,
    maxTokens: config.maxTokens,
    timeout: config.requestTimeout
  },
  rateLimit: {
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMax
  }
};

// Validation helpers
export const validators = {
  isValidEmail: (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },
  
  isValidUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
  
  isValidApiKey: (key: string): boolean => {
    return key.length >= 32 && /^[A-Za-z0-9_-]+$/.test(key);
  }
};

// Configuration validation
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!config.geminiApiKey) {
    errors.push('GEMINI_API_KEY is required');
  } else if (!validators.isValidApiKey(config.geminiApiKey)) {
    errors.push('GEMINI_API_KEY appears to be invalid');
  }
  
  if (config.rateLimitMax < 1 || config.rateLimitMax > 1000) {
    errors.push('RATE_LIMIT_MAX must be between 1 and 1000');
  }
  
  if (config.rateLimitWindowMs < 1000 || config.rateLimitWindowMs > 3600000) {
    errors.push('RATE_LIMIT_WINDOW_MS must be between 1000 and 3600000');
  }
  
  if (config.maxTokens < 100 || config.maxTokens > 100000) {
    errors.push('MAX_TOKENS must be between 100 and 100000');
  }
  
  if (config.requestTimeout < 1000 || config.requestTimeout > 300000) {
    errors.push('REQUEST_TIMEOUT must be between 1000 and 300000');
  }
  
  if (config.baseUrl && !validators.isValidUrl(config.baseUrl)) {
    errors.push('BASE_URL must be a valid URL');
  }
  
  if (config.apiUrl && !validators.isValidUrl(config.apiUrl)) {
    errors.push('API_URL must be a valid URL');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Development helpers
export const debug = {
  logConfig: () => {
    if (config.isDevelopment) {
      console.log('Configuration loaded:', {
        ...config,
        geminiApiKey: config.geminiApiKey ? '[REDACTED]' : 'NOT_SET',
        adminApiKey: config.adminApiKey ? '[REDACTED]' : 'NOT_SET'
      });
    }
  },
  
  validateAndLog: () => {
    const validation = validateConfig();
    if (config.isDevelopment) {
      console.log('Configuration validation:', validation);
    }
    return validation;
  }
};

export default config;