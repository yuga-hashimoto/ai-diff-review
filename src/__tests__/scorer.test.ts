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
  it('should return perfect score for no issues', () => {
    const score = calculateTrustScore([]);
    expect(score.overall).toBe(100);
    expect(score.breakdown['type-safety']).toBe(100);
    expect(score.breakdown['security']).toBe(100);
    expect(score.grade).toBe('A');
  });

  it('should reduce score for critical issues', () => {
    const issues = [makeIssue({ severity: 'critical', category: 'security' })];
    const score = calculateTrustScore(issues);
    expect(score.overall).toBeLessThan(70);
    expect(score.breakdown['security']).toBeLessThan(70);
  });

  it('should reduce score proportionally by severity', () => {
    const low = calculateTrustScore([makeIssue({ severity: 'low' })]);
    const medium = calculateTrustScore([makeIssue({ severity: 'medium' })]);
    const high = calculateTrustScore([makeIssue({ severity: 'high' })]);
    const critical = calculateTrustScore([makeIssue({ severity: 'critical' })]);

    expect(critical.overall).toBeLessThan(high.overall);
    expect(high.overall).toBeLessThan(medium.overall);
    expect(medium.overall).toBeLessThan(low.overall);
  });

  it('should assign correct grades', () => {
    expect(calculateTrustScore([]).grade).toBe('A');

    const manyIssues = Array(10).fill(null).map(() => makeIssue({ severity: 'critical' }));
    expect(calculateTrustScore(manyIssues).grade).toBe('F');
  });

  it('should handle mixed categories', () => {
    const issues = [
      makeIssue({ category: 'type-safety', severity: 'high' }),
      makeIssue({ category: 'security', severity: 'critical' }),
      makeIssue({ category: 'edge-cases', severity: 'medium' }),
    ];
    const score = calculateTrustScore(issues);

    expect(score.breakdown['security']).toBeLessThan(score.breakdown['edge-cases']);
    expect(score.breakdown['type-safety']).toBeLessThan(score.breakdown['edge-cases']);
    expect(score.breakdown['code-quality']).toBe(100);
    expect(score.breakdown['test-coverage']).toBe(100);
  });

  it('should never return negative scores', () => {
    const issues = Array(50).fill(null).map(() => makeIssue({ severity: 'critical' }));
    const score = calculateTrustScore(issues);
    expect(score.overall).toBeGreaterThanOrEqual(0);
    Object.values(score.breakdown).forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(0);
    });
  });
});
