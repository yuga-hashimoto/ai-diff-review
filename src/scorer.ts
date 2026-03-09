import { CategoryScores, Issue, ReviewResult } from './types.js';

const SEVERITY_WEIGHTS: Record<Issue['severity'], number> = {
  critical: 25,
  high: 15,
  medium: 8,
  low: 3,
};

const CATEGORY_WEIGHTS: Record<keyof CategoryScores, number> = {
  security: 0.30,
  typeSafety: 0.20,
  edgeCases: 0.20,
  testCoverage: 0.15,
  codeQuality: 0.15,
};

export function calculateScore(
  issues: Issue[],
  categories: CategoryScores,
  _totalLines: number
): Omit<ReviewResult, 'summary' | 'filesAnalyzed' | 'linesChanged' | 'issues'> {
  let weightedScore = 0;
  for (const [category, weight] of Object.entries(CATEGORY_WEIGHTS)) {
    weightedScore += categories[category as keyof CategoryScores] * weight;
  }

  let issuePenalty = 0;
  for (const issue of issues) {
    issuePenalty += SEVERITY_WEIGHTS[issue.severity];
  }
  issuePenalty = Math.min(issuePenalty, 60);

  const finalScore = Math.max(0, Math.min(100, Math.round(weightedScore - issuePenalty)));

  return { score: finalScore, categories };
}