// Cover Letter Types and Interfaces

export interface CoverLetterRequest {
  resumeText: string;
  jobTitle: string;
  companyName: string;
  jobDescription?: string;
  additionalInstructions?: string;
  tone?: 'professional' | 'friendly' | 'confident' | 'conversational';
  length?: 'short' | 'medium' | 'long';
  templateId?: string;
  customizations?: CoverLetterCustomizations;
}

export interface CoverLetterCustomizations {
  includeSkills?: boolean;
  includeProjects?: boolean;
  includeAchievements?: boolean;
  emphasizeExperience?: boolean;
  personalizedIntro?: boolean;
  callToAction?: boolean;
  contactInfo?: boolean;
  references?: boolean;
}

export interface CoverLetterAnalysis {
  score: number;
  sentiment: 'poor' | 'fair' | 'good' | 'excellent';
  suggestions: CoverLetterSuggestion[];
  summary: {
    strengths: string[];
    improvements: string[];
  };
  hrPerspective: {
    sentiment: 'positive' | 'neutral' | 'negative';
    summary: string;
  };
  keyMetrics: {
    wordCount: number;
    readabilityScore: number;
    personalizedElements: number;
    skillsMatching: number;
  };
}

export interface CoverLetterSuggestion {
  type: 'improvement' | 'success' | 'warning' | 'error';
  category: 'Content' | 'Structure' | 'Tone' | 'Matching' | 'Formatting';
  message: string;
  impact: 'low' | 'medium' | 'high' | 'positive';
  section?: string;
  priority?: number;
  actionable?: string;
}

export interface CoverLetterTemplate {
  id: string;
  name: string;
  description: string;
  structure: string[];
  tone: string;
  length: 'short' | 'medium' | 'long';
  industry?: string[];
  isPro?: boolean;
  preview?: string;
}

export interface CoverLetterResult {
  id: string;
  content: string;
  analysis: CoverLetterAnalysis;
  template: CoverLetterTemplate;
  metadata: {
    createdAt: string;
    wordCount: number;
    estimatedReadTime: number;
    jobTitle: string;
    companyName: string;
    version: number;
  };
}

export interface CoverLetterExport {
  format: 'pdf' | 'docx' | 'txt' | 'html';
  content: string;
  styling?: 'basic' | 'professional' | 'modern' | 'minimal';
}

// Pro Features Types
export interface ProFeatures {
  templates: {
    premium: CoverLetterTemplate[];
    industry: CoverLetterTemplate[];
    creative: CoverLetterTemplate[];
  };
  analytics: {
    successRate: number;
    commonSuggestions: string[];
    industryBenchmarks: Record<string, number>;
    performanceMetrics: {
      avgScore: number;
      avgWordCount: number;
      avgReadTime: number;
    };
  };
  customization: {
    brandColors: string[];
    fontOptions: string[];
    layoutOptions: string[];
    signatureIntegration: boolean;
  };
  collaboration: {
    shareLink: string;
    reviewMode: boolean;
    commentingEnabled: boolean;
    versionHistory: CoverLetterVersion[];
  };
}

export interface CoverLetterVersion {
  id: string;
  version: number;
  content: string;
  changes: string[];
  timestamp: string;
  author: string;
}

// Integration Types
export interface ResumeIntegration {
  autoExtractSkills: boolean;
  matchExperience: boolean;
  alignTone: boolean;
  syncContactInfo: boolean;
  suggestImprovements: boolean;
}

export interface JobDescriptionAnalysis {
  requirements: string[];
  skills: string[];
  keywords: string[];
  companyValues: string[];
  tone: string;
  level: 'entry' | 'mid' | 'senior' | 'executive';
}

export interface PersonalizationEngine {
  companyResearch: {
    industry: string;
    size: string;
    culture: string;
    values: string[];
  };
  roleAnalysis: {
    responsibilities: string[];
    requirements: string[];
    skills: string[];
    seniority: string;
  };
  matchingScore: number;
  suggestions: string[];
}

export const COVER_LETTER_TEMPLATES: CoverLetterTemplate[] = [
  {
    id: 'professional-standard',
    name: 'Professional Standard',
    description: 'A classic, professional cover letter template suitable for most industries.',
    structure: ['header', 'salutation', 'opening', 'body', 'closing', 'signature'],
    tone: 'professional',
    length: 'medium',
    isPro: false,
    preview: 'Dear [Hiring Manager], I am writing to express my strong interest in the [Position] role at [Company]...'
  },
  {
    id: 'modern-creative',
    name: 'Modern Creative',
    description: 'A contemporary template with creative elements for design and marketing roles.',
    structure: ['header', 'hook', 'story', 'value-proposition', 'call-to-action'],
    tone: 'friendly',
    length: 'medium',
    industry: ['design', 'marketing', 'media'],
    isPro: true,
    preview: 'Your recent [Company Achievement] caught my attention because...'
  },
  {
    id: 'tech-focused',
    name: 'Tech-Focused',
    description: 'Optimized for technology and engineering positions with technical achievements.',
    structure: ['header', 'technical-intro', 'achievements', 'problem-solving', 'closing'],
    tone: 'confident',
    length: 'short',
    industry: ['technology', 'engineering', 'software'],
    isPro: true,
    preview: 'As a [Title] with [X] years of experience in [Technology Stack]...'
  },
  {
    id: 'executive-level',
    name: 'Executive Level',
    description: 'Sophisticated template for senior leadership and executive positions.',
    structure: ['header', 'executive-summary', 'leadership-impact', 'strategic-vision', 'closing'],
    tone: 'confident',
    length: 'long',
    industry: ['executive', 'leadership', 'management'],
    isPro: true,
    preview: 'Throughout my [X]-year career leading [Industry] organizations...'
  }
];

export const TONE_GUIDELINES = {
  professional: {
    description: 'Formal, respectful, and business-appropriate',
    characteristics: ['formal language', 'structured approach', 'respectful tone'],
    examples: ['I am writing to express my interest', 'My background in', 'I would welcome the opportunity']
  },
  friendly: {
    description: 'Warm, approachable, yet professional',
    characteristics: ['conversational tone', 'personal connection', 'enthusiasm'],
    examples: ['I was excited to learn about', 'Your company culture resonates with me', 'I would love to contribute']
  },
  confident: {
    description: 'Assertive, achievement-focused, and results-oriented',
    characteristics: ['strong statements', 'quantified achievements', 'direct approach'],
    examples: ['I have successfully led', 'My track record includes', 'I am confident that']
  },
  conversational: {
    description: 'Natural, engaging, and personable',
    characteristics: ['storytelling elements', 'personal anecdotes', 'engaging narrative'],
    examples: ['When I read about', 'This reminds me of when', 'I believe we share']
  }
};