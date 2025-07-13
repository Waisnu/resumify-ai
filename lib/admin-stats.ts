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
}

const STATS_FILE = path.join(process.cwd(), 'admin-stats.json');

export async function getStats(): Promise<AdminStats> {
  try {
    const data = await fs.readFile(STATS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return default stats
    return {
      totalResumes: 0,
      totalAnalyses: 0,
      totalLatexGenerations: 0,
      recentErrors: [],
      lastUpdated: new Date().toISOString()
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