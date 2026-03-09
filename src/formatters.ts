import { AnalysisResult, TrustScore } from './types.js';

const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';
const DIM = '\x1b[2m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BRIGHT_RED = '\x1b[91m';

function scoreColor(score: number): string {
  if (score >= 80) return GREEN;
  if (score >= 60) return YELLOW;
  if (score >= 40) return RED;
  return BRIGHT_RED;
}

function severityColor(severity: string): string {
  switch (severity) {
    case 'critical': return BRIGHT_RED;
    case 'high': return RED;
    case 'medium': return YELLOW;
    case 'low': return CYAN;
    default: return DIM;
  }
}

function scoreBar(score: number): string {
  const filled = Math.round(score / 5);
  const empty = 20 - filled;
  return `${scoreColor(score)}${'#'.repeat(filled)}${DIM}${'-'.repeat(empty)}${RESET} ${score}/100`;
}

/**
 * Format result as colored terminal text
 */
export function formatText(result: AnalysisResult): string {
  const lines: string[] = [];
  const status = result.trustScore.overall >= 70 ? `${GREEN}PASS${RESET}` : `${RED}FAIL${RESET}`;

  lines.push('');
  lines.push(`${BOLD}  ai-diff-review  Trust Score Report${RESET}`);
  lines.push(`  ${'='.repeat(40)}`);
  lines.push('');
  lines.push(`  Trust Score: ${scoreBar(result.trustScore.overall)}  [${status}]`);
  lines.push('');
  lines.push(`  ${BOLD}Category Breakdown:${RESET}`);
  lines.push(`    Type Safety:   ${scoreBar(result.trustScore.typeSafety)}`);
  lines.push(`    Edge Cases:    ${scoreBar(result.trustScore.edgeCases)}`);
  lines.push(`    Security:      ${scoreBar(result.trustScore.security)}`);
  lines.push(`    Test Coverage: ${scoreBar(result.trustScore.testCoverage)}`);
  lines.push(`    Code Quality:  ${scoreBar(result.trustScore.codeQuality)}`);
  lines.push('');
  lines.push(`  ${DIM}Files: ${result.files.length} | +${result.totalAdditions} -${result.totalDeletions} | ${result.provider}/${result.model} | ${result.analysisTime}ms${RESET}`);
  lines.push('');

  if (result.issues.length > 0) {
    lines.push(`  ${BOLD}Issues (${result.issues.length}):${RESET}`);
    lines.push('');
    for (const issue of result.issues) {
      const sev = `${severityColor(issue.severity)}${issue.severity.toUpperCase().padEnd(8)}${RESET}`;
      const loc = issue.line ? `${issue.file}:${issue.line}` : issue.file;
      lines.push(`    ${sev} [${issue.category}] ${issue.title}`);
      lines.push(`             ${DIM}${loc}${RESET}`);
      if (issue.description) {
        lines.push(`             ${issue.description}`);
      }
      if (issue.suggestion) {
        lines.push(`             ${GREEN}Fix: ${issue.suggestion}${RESET}`);
      }
      lines.push('');
    }
  } else {
    lines.push(`  ${GREEN}No issues found.${RESET}`);
    lines.push('');
  }

  if (result.summary) {
    lines.push(`  ${DIM}> ${result.summary}${RESET}`);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Format result as JSON
 */
export function formatJson(result: AnalysisResult): string {
  return JSON.stringify(result, null, 2);
}

/**
 * Format result as Markdown
 */
export function formatMarkdown(result: AnalysisResult): string {
  const lines: string[] = [];
  const status = result.trustScore.overall >= 70 ? 'PASS' : 'FAIL';

  lines.push('# AI Diff Review Report');
  lines.push('');
  lines.push(`**Trust Score: ${result.trustScore.overall}/100** (${status})`);
  lines.push('');
  lines.push('| Category | Score |');
  lines.push('|----------|-------|');
  lines.push(`| Type Safety | ${result.trustScore.typeSafety}/100 |`);
  lines.push(`| Edge Cases | ${result.trustScore.edgeCases}/100 |`);
  lines.push(`| Security | ${result.trustScore.security}/100 |`);
  lines.push(`| Test Coverage | ${result.trustScore.testCoverage}/100 |`);
  lines.push(`| Code Quality | ${result.trustScore.codeQuality}/100 |`);
  lines.push('');

  if (result.issues.length > 0) {
    lines.push(`## Issues (${result.issues.length})`);
    lines.push('');
    lines.push('| Severity | Category | File | Issue | Suggestion |');
    lines.push('|----------|----------|------|-------|------------|');
    for (const issue of result.issues) {
      const loc = issue.line ? `${issue.file}:${issue.line}` : issue.file;
      lines.push(`| ${issue.severity.toUpperCase()} | ${issue.category} | ${loc} | ${issue.title} | ${issue.suggestion || '-'} |`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push(`*${result.files.length} files analyzed, +${result.totalAdditions} -${result.totalDeletions} lines | ${result.provider}/${result.model} | ${result.analysisTime}ms*`);
  if (result.summary) {
    lines.push('');
    lines.push(`> ${result.summary}`);
  }
  lines.push('');

  return lines.join('\n');
}

/**
 * Format result in the specified format
 */
export function formatResult(
  result: AnalysisResult,
  format: 'text' | 'json' | 'markdown' = 'text',
): string {
  switch (format) {
    case 'json': return formatJson(result);
    case 'markdown': return formatMarkdown(result);
    default: return formatText(result);
  }
}
