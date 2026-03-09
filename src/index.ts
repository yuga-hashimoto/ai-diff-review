export { parseDiff } from './parser.js';
export { analyzeDiff } from './analyzer.js';
export { calculateTrustScore } from './scorer.js';
export { loadConfig } from './config.js';
export { formatResult } from './formatters.js';
export type {
  DiffFile,
  DiffChunk,
  DiffChange,
  AnalysisResult,
  AnalysisIssue,
  TrustScore,
  AnalysisCategory,
  IssueSeverity,
  Config,
} from './types.js';
