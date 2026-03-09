/**
 * Parsed diff file
 */
export interface DiffFile {
  oldPath: string;
  newPath: string;
  isNew: boolean;
  isDeleted: boolean;
  isBinary: boolean;
  language: string;
  chunks: DiffChunk[];
}

export interface DiffChunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  header: string;
  changes: DiffChange[];
}

export interface DiffChange {
  type: 'add' | 'delete' | 'context';
  content: string;
  oldLine?: number;
  newLine?: number;
}

/**
 * Analysis categories for trust scoring
 */
export type AnalysisCategory =
  | 'type-safety'
  | 'edge-cases'
  | 'security'
  | 'test-coverage'
  | 'code-quality';

export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/**
 * A single issue found during analysis
 */
export interface AnalysisIssue {
  category: AnalysisCategory;
  severity: IssueSeverity;
  file: string;
  line: number | null;
  title: string;
  description: string;
  suggestion: string;
}

/**
 * Trust score breakdown
 */
export interface TrustScore {
  overall: number;       // 0-100
  typeSafety: number;
  edgeCases: number;
  security: number;
  testCoverage: number;
  codeQuality: number;
}

/**
 * Full analysis result
 */
export interface AnalysisResult {
  files: string[];
  totalAdditions: number;
  totalDeletions: number;
  issues: AnalysisIssue[];
  trustScore: TrustScore;
  summary: string;
  provider: string;
  model: string;
  analysisTime: number;
}

/**
 * LLM provider interface
 */
export interface LLMProvider {
  analyze(prompt: string): Promise<string>;
}

/**
 * Configuration
 */
export interface Config {
  provider: 'openai' | 'ollama' | 'anthropic';
  model: string;
  threshold: number;
  apiKey?: string;
  ollamaHost?: string;
  rules?: string[];
  ignorePatterns?: string[];
}
