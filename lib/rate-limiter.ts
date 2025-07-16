import { NextApiRequest, NextApiResponse } from 'next';
import { RateLimitError } from './error-handler';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  lastRequest: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  private getKey(req: NextApiRequest): string {
    // Use IP address as primary key, with fallback to user-agent
    const ip = req.socket.remoteAddress || 
              req.headers['x-forwarded-for'] || 
              req.headers['x-real-ip'] || 
              'unknown';
    
    return `${ip}:${req.url}`;
  }

  private cleanup(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  async checkLimit(req: NextApiRequest): Promise<void> {
    const key = this.getKey(req);
    const now = Date.now();
    
    let entry = this.store.get(key);
    
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs,
        lastRequest: now
      };
      this.store.set(key, entry);
    }
    
    // Check if too many requests
    if (entry.count >= this.config.maxRequests) {
      const timeUntilReset = Math.ceil((entry.resetTime - now) / 1000);
      throw new RateLimitError(`Rate limit exceeded. Try again in ${timeUntilReset} seconds.`);
    }
    
    // Check for rapid consecutive requests (simple DoS protection)
    if (now - entry.lastRequest < 1000) { // Less than 1 second between requests
      entry.count += 2; // Penalize rapid requests
    } else {
      entry.count += 1;
    }
    
    entry.lastRequest = now;
    this.store.set(key, entry);
  }

  getStatus(req: NextApiRequest): { remaining: number; resetTime: number } {
    const key = this.getKey(req);
    const entry = this.store.get(key);
    
    if (!entry) {
      return { remaining: this.config.maxRequests, resetTime: 0 };
    }
    
    return {
      remaining: Math.max(0, this.config.maxRequests - entry.count),
      resetTime: entry.resetTime
    };
  }
}

// Different rate limits for different endpoints
export const analysisRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10 // 10 requests per 15 minutes
});

export const extractRateLimiter = new RateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 20 // 20 requests per 5 minutes
});

export const latexRateLimiter = new RateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  maxRequests: 5 // 5 requests per 10 minutes
});

export const adminRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 3 // 3 login attempts per 15 minutes
});

// Middleware function to apply rate limiting
export function withRateLimit(rateLimiter: RateLimiter) {
  return async function rateLimitMiddleware(
    req: NextApiRequest,
    res: NextApiResponse,
    next: () => Promise<void>
  ) {
    try {
      await rateLimiter.checkLimit(req);
      
      // Add rate limit headers
      const status = rateLimiter.getStatus(req);
      res.setHeader('X-RateLimit-Remaining', status.remaining.toString());
      res.setHeader('X-RateLimit-Reset', status.resetTime.toString());
      
      await next();
    } catch (error) {
      if (error instanceof RateLimitError) {
        const status = rateLimiter.getStatus(req);
        res.setHeader('X-RateLimit-Remaining', '0');
        res.setHeader('X-RateLimit-Reset', status.resetTime.toString());
        res.setHeader('Retry-After', Math.ceil((status.resetTime - Date.now()) / 1000).toString());
        
        return res.status(429).json({
          error: error.message,
          code: 'RATE_LIMIT_EXCEEDED'
        });
      }
      
      throw error;
    }
  };
}