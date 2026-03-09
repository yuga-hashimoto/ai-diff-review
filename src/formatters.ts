import { ReviewResult } from './types.js';

export function formatReport(result: ReviewResult): string {
  const status = result.score >= 70 ? 'PASS' : 'FAIL';
  let md = `# AI Diff Review Report\n\n`;
  md += `**Trust Score: ${result.score}/100** (${status})\n\n`;
  md += `| Category | Score |\n|----------|-------|\n`;
  md += `| Type Safety | ${result.categories.typeSafety}/100 |\n`;
  md += `| Security | ${result.categories.security}/100 |\n`;
  md += `| Edge Cases | ${result.categories.edgeCases}/100 |\n`;
  md += `| Test Coverage | ${result.categories.testCoverage}/100 |\n`;
  md += `| Code Quality | ${result.categories.codeQuality}/100 |\n\n`;

  if (result.issues.length > 0) {
    md += `## Issues (${result.issues.length})\n\n`;
    for (const issue of result.issues) {
      md += `- **[${issue.severity.toUpperCase()}]** \`${issue.file}:${issue.line}\` — ${issue.message}\n`;
      if (issue.suggestion) md += `  - Fix: ${issue.suggestion}\n`;
    }
    md += '\n';
  }

  md += `---\n*${result.filesAnalyzed} files analyzed, ${result.linesChanged} lines changed*\n`;
  if (result.summary) md += `\n> ${result.summary}\n`;
  return md;
}

export function formatScore(result: ReviewResult): string {
  return `${result.score}/100`;
}

export function formatCI(result: ReviewResult, threshold: number): string {
  const passed = result.score >= threshold;
  return JSON.stringify({ passed, score: result.score, threshold, issues: result.issues.length });
}