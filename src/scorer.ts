import { AnalysisIssue, TrustScore, IssueSeverity, AnalysisCategory } from './types.js';

const SEVERITY_PENALTIES: Record<IssueSeverity, number> = {
  critical: 25,
  high: 15,
  medium: 8,
  low: 3,
  info: 0,
};

const CATEGORY_WEIGHTS: Record<AnalysisCategory, keyof Omit<TrustScore, 'overall'>> = {
  'type-safety': 'typeSafety',
  'edge-cases': 'edgeCases',
  'security': 'security',
  'test-coverage': 'testCoverage',
  'code-quality': 'codeQuality',
};

/**
 * Calculate trust score from analysis issues.
 * Starts at 100 and deducts points per issue severity.
 * Each category gets its own sub-score.
 */
export function calculateTrustScore(issues: AnalysisIssue[]): TrustScore {
  const categoryPenalties: Record<string, number> = {
    typeSafety: 0,
    edgeCases: 0,
    security: 0,
    testCoverage: 0,
    codeQuality: 0,
  };

  let totalPenalty = 0;

  for (const issue of issues) {
    const penalty = SEVERITY_PENALTIES[issue.severity];
    totalPenalty += penalty;

    const scoreKey = CATEGORY_WEIGHTS[issue.category];
    if (scoreKey) {
      categoryPenalties[scoreKey] += penalty;
    }
  }

  return {
    overall: clamp(100 - totalPenalty),
    typeSafety: clamp(100 - categoryPenalties.typeSafety),
    edgeCases: clamp(100 - categoryPenalties.edgeCases),
    security: clamp(100 - categoryPenalties.security),
    testCoverage: clamp(100 - categoryPenalties.testCoverage),
    codeQuality: clamp(100 - categoryPenalties.codeQuality),
  };
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}
