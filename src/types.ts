export interface ReviewOptions {
  model?: string;
  provider?: 'ollama' | 'openai' | 'anthropic';
  threshold?: number;
  rules?: string[];
  ignorePatterns?: string[];
}

export interface ReviewResult {
  score: number;
  categories: CategoryScores;
  issues: Issue[];
  summary: string;
  filesAnalyzed: number;
  linesChanged: number;
}

export interface CategoryScores {
  typeSafety: number;
  security: number;
  edgeCases: number;
  testCoverage: number;
  codeQuality: number;
}

export interface Issue {
  file: string;
  line: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  message: string;
  suggestion?: string;
}

export interface DiffFile {
  path: string;
  language: string;
  additions: DiffLine[];
  deletions: DiffLine[];
  hunks: DiffHunk[];
}

export interface DiffLine {
  lineNumber: number;
  content: string;
}

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  content: string;
}

export interface LLMAnalysis {
  categories: CategoryScores;
  issues: Issue[];
  summary: string;
}

export interface LLMProvider {
  analyze(prompt: string): Promise<string>;
}