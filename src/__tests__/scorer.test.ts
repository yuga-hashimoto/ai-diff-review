import { describe, it, expect } from 'vitest';
import { calculateTrustScore } from '../scorer.js';
import { AnalysisIssue } from '../types.js';

function makeIssue(overrides: Partial<AnalysisIssue> = {}): AnalysisIssue {
  return {
    category: 'code-quality',
    severity: 'medium',
    file: 'test.ts',
    line: 1,
    title: 'Test issue',
    description: 'Test description',
    suggestion: 'Fix it',
    ...overrides,
  };
}

describe('calculateTrustScore', () => {
  it('should return perfect score with no issues', () => {
    const score = calculateTrustScore([]);
    expect(score.overall).toBe(100);
    expect(score.typeSafety).toBe(100);
    expect(score.edgeCases).toBe(100);
    expect(score.security).toBe(100);
    expect(score.testCoverage).toBe(100);
    expect(score.codeQuality).toBe(100);
  });

  it('should deduct 25 points per critical issue', () => {
    const score = calculateTrustScore([
      makeIssue({ severity: 'critical', category: 'security' }),
    ]);
    expect(score.overall).toBe(75);
    expect(score.security).toBe(75);
  });

  it('should deduct 15 points per high issue', () => {
    const score = calculateTrustScore([
      makeIssue({ severity: 'high', category: 'type-safety' }),
    ]);
    expect(score.overall).toBe(85);
    expect(score.typeSafety).toBe(85);
  });

  it('should deduct 8 points per medium issue', () => {
    const score = calculateTrustScore([
      makeIssue({ severity: 'medium', category: 'edge-cases' }),
    ]);
    expect(score.overall).toBe(92);
    expect(score.edgeCases).toBe(92);
  });

  it('should deduct 3 points per low issue', () => {
    const score = calculateTrustScore([
      makeIssue({ severity: 'low', category: 'test-coverage' }),
    ]);
    expect(score.overall).toBe(97);
    expect(score.testCoverage).toBe(97);
  });

  it('should not deduct for info severity', () => {
    const score = calculateTrustScore([
      makeIssue({ severity: 'info' }),
    ]);
    expect(score.overall).toBe(100);
  });

  it('should accumulate penalties across multiple issues', () => {
    const score = calculateTrustScore([
      makeIssue({ severity: 'critical', category: 'security' }),
      makeIssue({ severity: 'high', category: 'security' }),
      makeIssue({ severity: 'medium', category: 'type-safety' }),
    ]);
    // Overall: 100 - 25 - 15 - 8 = 52
    expect(score.overall).toBe(52);
    // Security: 100 - 25 - 15 = 60
    expect(score.security).toBe(60);
    // Type safety: 100 - 8 = 92
    expect(score.typeSafety).toBe(92);
  });

  it('should clamp score to 0 minimum', () => {
    const issues = Array.from({ length: 10 }, () =>
      makeIssue({ severity: 'critical', category: 'security' }),
    );
    const score = calculateTrustScore(issues);
    expect(score.overall).toBe(0);
    expect(score.security).toBe(0);
  });

  it('should isolate category scores', () => {
    const score = calculateTrustScore([
      makeIssue({ severity: 'critical', category: 'security' }),
    ]);
    // Only security should be affected
    expect(score.typeSafety).toBe(100);
    expect(score.edgeCases).toBe(100);
    expect(score.testCoverage).toBe(100);
    expect(score.codeQuality).toBe(100);
    expect(score.security).toBe(75);
  });
});
