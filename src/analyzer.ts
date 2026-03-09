import { DiffFile, AnalysisResult, AnalysisIssue, AnalysisCategory, IssueSeverity } from './types.js';
import { createProvider } from './providers/index.js';
import { loadConfig } from './config.js';
import { calculateTrustScore } from './scorer.js';

const ANALYSIS_PROMPT = `You are an expert code reviewer specializing in AI-generated code analysis.
Analyze the following git diff and evaluate it across these categories:

1. **Type Safety** - Are types properly defined? Any implicit 'any'? Generic misuse?
2. **Edge Cases** - Null/undefined handling? Empty arrays? Boundary conditions?
3. **Security** - Injection risks? Unsafe deserialization? Hardcoded secrets? XSS/CSRF?
4. **Test Coverage** - Are changes covered by tests? Missing test scenarios?
5. **Code Quality** - Naming conventions? DRY violations? Complexity?

For each issue found, respond in this JSON format:
{
  "issues": [
    {
      "category": "type-safety" | "edge-cases" | "security" | "test-coverage" | "code-quality",
      "severity": "critical" | "high" | "medium" | "low" | "info",
      "file": "filename",
      "line": line_number_or_null,
      "title": "Short issue title",
      "description": "Detailed explanation",
      "suggestion": "How to fix this"
    }
  ],
  "summary": "Brief overall assessment"
}

Be thorough but avoid false positives. Only flag real concerns.`;

interface LLMResponse {
  issues: AnalysisIssue[];
  summary: string;
}

/**
 * Analyze parsed diff files using an LLM provider.
 * Returns trust scores, issues, and summary.
 */
export async function analyzeDiff(
  files: DiffFile[],
  configPath?: string,
): Promise<AnalysisResult> {
  const config = loadConfig(configPath);
  const provider = createProvider(config);

  const diffContent = files
    .map((f) => {
      const status = f.isNew ? '(new file)' : f.isDeleted ? '(deleted)' : '(modified)';
      return `--- ${f.oldPath} ${status}\n+++ ${f.newPath}\n${f.chunks
        .map((c) => `@@ -${c.oldStart},${c.oldLines} +${c.newStart},${c.newLines} @@${c.header ? ' ' + c.header : ''}\n${c.changes
          .map((ch) => `${ch.type === 'add' ? '+' : ch.type === 'delete' ? '-' : ' '}${ch.content}`)
          .join('\n')}`)
        .join('\n')}`;
    })
    .join('\n\n');

  const prompt = `${ANALYSIS_PROMPT}\n\n## Diff to analyze:\n\n\`\`\`diff\n${diffContent}\n\`\`\``;

  const startTime = Date.now();
  const responseText = await provider.analyze(prompt);
  const analysisTime = Date.now() - startTime;

  const parsed = parseResponse(responseText);
  const trustScore = calculateTrustScore(parsed.issues);

  const totalAdditions = files.reduce(
    (sum, f) => sum + f.chunks.reduce(
      (s, c) => s + c.changes.filter((ch) => ch.type === 'add').length, 0,
    ), 0,
  );
  const totalDeletions = files.reduce(
    (sum, f) => sum + f.chunks.reduce(
      (s, c) => s + c.changes.filter((ch) => ch.type === 'delete').length, 0,
    ), 0,
  );

  return {
    files: files.map((f) => f.newPath || f.oldPath),
    totalAdditions,
    totalDeletions,
    issues: parsed.issues,
    trustScore,
    summary: parsed.summary,
    provider: config.provider,
    model: config.model,
    analysisTime,
  };
}

function parseResponse(text: string): LLMResponse {
  // Extract JSON from potential markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = (jsonMatch?.[1] ?? text).trim();

  try {
    const parsed = JSON.parse(jsonStr);
    return {
      issues: Array.isArray(parsed.issues)
        ? parsed.issues.map(validateIssue).filter((i): i is AnalysisIssue => i !== null)
        : [],
      summary: typeof parsed.summary === 'string' ? parsed.summary : 'Analysis complete.',
    };
  } catch {
    return {
      issues: [],
      summary: 'Failed to parse LLM response. Raw output may contain useful information.',
    };
  }
}

const VALID_CATEGORIES: AnalysisCategory[] = ['type-safety', 'edge-cases', 'security', 'test-coverage', 'code-quality'];
const VALID_SEVERITIES: IssueSeverity[] = ['critical', 'high', 'medium', 'low', 'info'];

function validateIssue(raw: unknown): AnalysisIssue | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  return {
    category: VALID_CATEGORIES.includes(obj.category as AnalysisCategory)
      ? (obj.category as AnalysisCategory)
      : 'code-quality',
    severity: VALID_SEVERITIES.includes(obj.severity as IssueSeverity)
      ? (obj.severity as IssueSeverity)
      : 'medium',
    file: typeof obj.file === 'string' ? obj.file : 'unknown',
    line: typeof obj.line === 'number' ? obj.line : null,
    title: typeof obj.title === 'string' ? obj.title : 'Unnamed issue',
    description: typeof obj.description === 'string' ? obj.description : '',
    suggestion: typeof obj.suggestion === 'string' ? obj.suggestion : '',
  };
}
