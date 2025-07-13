// Admin Statistics Utility
// Since we don't have a database, we'll use a simple file-based approach for persistent storage

import fs from 'fs/promises';
import path from 'path';

interface AdminStats {
  totalResumes: number;
  totalAnalyses: number;
  totalLatexGenerations: number;
  recentErrors: string[];
  lastUpdated: string;
  // New token tracking fields
  dailyTokenUsage: {
    date: string;
    analysisTokens: number;
    latexTokens: number;
    totalTokens: number;
  };
  modelInfo: {
    analysisModel: string;
    latexModel: string;
    dailyLimit: number; // Gemini 2.5 Pro free tier: 1500 requests/day
    requestsToday: number;
  };
  sessionStats: {
    tokensUsed: number;
    requestsCount: number;
    lastSessionTime: string;
  };
}

const STATS_FILE = path.join(process.cwd(), 'admin-stats.json');

export async function getStats(): Promise<AdminStats> {
  try {
    const data = await fs.readFile(STATS_FILE, 'utf8');
    const stats = JSON.parse(data);
    
    // Migration: ensure new properties exist for backward compatibility
    const today = new Date().toISOString().slice(0, 10);
    let needsUpdate = false;
    
    if (!stats.dailyTokenUsage) {
      stats.dailyTokenUsage = {
        date: today,
        analysisTokens: 0,
        latexTokens: 0,
        totalTokens: 0
      };
      needsUpdate = true;
    }
    
    if (!stats.modelInfo) {
      stats.modelInfo = {
        analysisModel: 'gemini-2.5-pro',
        latexModel: 'gemini-2.5-pro',
        dailyLimit: 1500,
        requestsToday: 0
      };
      needsUpdate = true;
    }
    
    if (!stats.sessionStats) {
      stats.sessionStats = {
        tokensUsed: 0,
        requestsCount: 0,
        lastSessionTime: new Date().toISOString()
      };
      needsUpdate = true;
    }
    
    // Save the migrated stats back to file
    if (needsUpdate) {
      stats.lastUpdated = new Date().toISOString();
      await fs.writeFile(STATS_FILE, JSON.stringify(stats, null, 2));
    }
    
    return stats;
  } catch (error) {
    // If file doesn't exist, return default stats
    return {
      totalResumes: 0,
      totalAnalyses: 0,
      totalLatexGenerations: 0,
      recentErrors: [],
      lastUpdated: new Date().toISOString(),
      dailyTokenUsage: {
        date: new Date().toISOString().slice(0, 10),
        analysisTokens: 0,
        latexTokens: 0,
        totalTokens: 0
      },
      modelInfo: {
        analysisModel: 'gemini-2.5-pro',
        latexModel: 'gemini-2.5-pro',
        dailyLimit: 1500,
        requestsToday: 0
      },
      sessionStats: {
        tokensUsed: 0,
        requestsCount: 0,
        lastSessionTime: new Date().toISOString()
      }
    };
  }
}

export async function updateStats(updates: Partial<AdminStats>): Promise<void> {
  try {
    const currentStats = await getStats();
    const newStats = {
      ...currentStats,
      ...updates,
      lastUpdated: new Date().toISOString()
    };
    
    await fs.writeFile(STATS_FILE, JSON.stringify(newStats, null, 2));
  } catch (error) {
    console.error('Failed to update stats:', error);
  }
}

export async function incrementCounter(counter: 'totalResumes' | 'totalAnalyses' | 'totalLatexGenerations'): Promise<void> {
  try {
    const stats = await getStats();
    stats[counter] += 1;
    await updateStats(stats);
  } catch (error) {
    console.error(`Failed to increment ${counter}:`, error);
  }
}

export async function logError(error: string): Promise<void> {
  try {
    const stats = await getStats();
    // Let's use a more user-friendly date format, e.g., 'YYYY-MM-DD HH:mm:ss'
    // We'll use toLocaleString for a readable local time (no timezone info)
    const now = new Date();
    const formattedTime = now.toLocaleString('en-CA', { // 'en-CA' gives YYYY-MM-DD format
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(',', '');
    stats.recentErrors.unshift(`${formattedTime}: ${error}`);

    // Keep only the last 50 errors
    if (stats.recentErrors.length > 50) {
      stats.recentErrors = stats.recentErrors.slice(0, 50);
    }
    
    await updateStats(stats);
  } catch (err) {
    console.error('Failed to log error:', err);
  }
}

export async function trackTokenUsage(
  type: 'analysis' | 'latex',
  tokensUsed: number,
  model: string
): Promise<void> {
  try {
    const stats = await getStats();
    const today = new Date().toISOString().slice(0, 10);
    
    // Ensure dailyTokenUsage exists (migration for old stats files)
    if (!stats.dailyTokenUsage) {
      stats.dailyTokenUsage = {
        date: today,
        analysisTokens: 0,
        latexTokens: 0,
        totalTokens: 0
      };
    }
    
    // Ensure modelInfo exists (migration for old stats files)
    if (!stats.modelInfo) {
      stats.modelInfo = {
        analysisModel: 'gemini-2.5-pro',
        latexModel: 'gemini-2.5-pro',
        dailyLimit: 1500,
        requestsToday: 0
      };
    }
    
    // Ensure sessionStats exists (migration for old stats files)
    if (!stats.sessionStats) {
      stats.sessionStats = {
        tokensUsed: 0,
        requestsCount: 0,
        lastSessionTime: new Date().toISOString()
      };
    }
    
    // Reset daily usage if it's a new day
    if (stats.dailyTokenUsage.date !== today) {
      stats.dailyTokenUsage = {
        date: today,
        analysisTokens: 0,
        latexTokens: 0,
        totalTokens: 0
      };
      stats.modelInfo.requestsToday = 0;
    }
    
    // Update token usage
    if (type === 'analysis') {
      stats.dailyTokenUsage.analysisTokens += tokensUsed;
      stats.modelInfo.analysisModel = model;
    } else {
      stats.dailyTokenUsage.latexTokens += tokensUsed;
      stats.modelInfo.latexModel = model;
    }
    
    stats.dailyTokenUsage.totalTokens = stats.dailyTokenUsage.analysisTokens + stats.dailyTokenUsage.latexTokens;
    stats.modelInfo.requestsToday += 1;
    
    // Update session stats
    stats.sessionStats.tokensUsed += tokensUsed;
    stats.sessionStats.requestsCount += 1;
    stats.sessionStats.lastSessionTime = new Date().toISOString();
    
    await updateStats(stats);
  } catch (error) {
    console.error('Failed to track token usage:', error);
  }
}

export async function calculateDailyCapacity(): Promise<{
  remainingRequests: number;
  estimatedAnalyses: number;
  estimatedLatexGenerations: number;
  percentageUsed: number;
}> {
  try {
    const stats = await getStats();
    
    // Ensure modelInfo exists (migration for old stats files)
    if (!stats.modelInfo) {
      stats.modelInfo = {
        analysisModel: 'gemini-2.5-pro',
        latexModel: 'gemini-2.5-pro',
        dailyLimit: 1500,
        requestsToday: 0
      };
    }
    
    const remainingRequests = Math.max(0, stats.modelInfo.dailyLimit - stats.modelInfo.requestsToday);
    
    // Estimate based on typical usage patterns
    // Analysis typically uses 1 request, LaTeX generation uses 1 request
    const estimatedAnalyses = Math.floor(remainingRequests * 0.6); // 60% for analysis
    const estimatedLatexGenerations = Math.floor(remainingRequests * 0.4); // 40% for LaTeX
    
    const percentageUsed = (stats.modelInfo.requestsToday / stats.modelInfo.dailyLimit) * 100;
    
    return {
      remainingRequests,
      estimatedAnalyses,
      estimatedLatexGenerations,
      percentageUsed
    };
  } catch (error) {
    console.error('Failed to calculate daily capacity:', error);
    return {
      remainingRequests: 0,
      estimatedAnalyses: 0,
      estimatedLatexGenerations: 0,
      percentageUsed: 100
    };
  }
} 