# ai-diff-review

**AI-generated code has a 30-50% chance of containing vulnerabilities.** This CLI scores every diff before it reaches production.

```
$ git diff | ai-diff-review

  ai-diff-review  Trust Score Report
  ================================

  Overall: 73/100 (Grade: C)

  Breakdown:
    Type Safety:    85/100
    Edge Cases:     70/100
    Security:       45/100  <-- WARNING
    Test Coverage:  80/100
    Code Quality:   90/100

  Issues Found: 4
    CRITICAL  [security]     SQL injection in user query builder (line 42)
    HIGH      [edge-cases]   Null pointer on empty response (line 87)
    MEDIUM    [type-safety]  Implicit 'any' in API handler (line 15)
    LOW       [code-quality] Magic number without constant (line 103)
```

## Why?

Copilot, ChatGPT, and Claude generate code that *looks* correct but often:
- Skips null checks and error handling
- Uses `any` types that bypass TypeScript safety
- Introduces SQL injection, XSS, or path traversal vulnerabilities
- Misses edge cases that only appear in production

**ai-diff-review** catches these before your PR gets merged.

## Quick Start

```bash
# Install globally
npm install -g ai-diff-review

# Score your staged changes (uses Ollama by default - free & local)
ai-diff-review --staged

# Or pipe any diff
git diff main | ai-diff-review

# Output as JSON for CI integration
ai-diff-review --staged --format json
```

## Setup

### Option 1: Ollama (Free, Local, Private)

```bash
# Install Ollama (https://ollama.ai)
curl -fsSL https://ollama.ai/install.sh | sh

# Pull a code-focused model
ollama pull codellama:13b

# Run analysis
ai-diff-review --staged
```

### Option 2: OpenAI

```bash
export OPENAI_API_KEY=sk-...
ai-diff-review --staged
```

Create `.ai-diff-review.json` in your project root:

```json
{
  "provider": "openai",
  "model": "gpt-4o",
  "threshold": 70
}
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: AI Diff Review
  run: |
    npm install -g ai-diff-review
    git diff ${{ github.event.pull_request.base.sha }} | ai-diff-review --format json > review.json
    SCORE=$(jq '.trustScore.overall' review.json)
    if [ "$SCORE" -lt 70 ]; then
      echo "::error::Trust score $SCORE is below threshold (70)"
      exit 1
    fi
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

### Pre-commit Hook

```bash
#!/bin/sh
# .git/hooks/pre-commit
ai-diff-review --staged --format text
if [ $? -ne 0 ]; then
  echo "Trust score below threshold. Fix issues before committing."
  exit 1
fi
```

## Scoring

| Grade | Score   | Meaning                              |
|-------|---------|--------------------------------------|
| A     | 90-100  | Safe to merge                        |
| B     | 80-89   | Minor issues, generally safe         |
| C     | 70-79   | Needs review, some concerns          |
| D     | 60-69   | Significant issues found             |
| F     | 0-59    | Do not merge without major fixes     |

### Categories

- **Type Safety** - Proper typing, no implicit `any`, correct generics
- **Edge Cases** - Null handling, empty arrays, boundary conditions
- **Security** - Injection, XSS, CSRF, hardcoded secrets, unsafe deserialization
- **Test Coverage** - Are changes covered? Missing test scenarios?
- **Code Quality** - Naming, DRY, complexity, best practices

## Programmatic API

```typescript
import { parseDiff, analyzeDiff, formatResult } from 'ai-diff-review';

const diff = fs.readFileSync('changes.patch', 'utf-8');
const files = parseDiff(diff);
const result = await analyzeDiff(files);

console.log(result.trustScore.overall); // 73
console.log(result.trustScore.grade);   // 'C'
console.log(result.issues);             // Array of issues

// Format for display
console.log(formatResult(result, 'markdown'));
```

## Configuration

| Field       | Default              | Description                          |
|-------------|----------------------|--------------------------------------|
| `provider`  | `"ollama"`           | LLM provider: `"ollama"` or `"openai"` |
| `model`     | `"codellama:13b"`    | Model name                           |
| `threshold` | `70`                 | Minimum score (exit 1 if below)      |
| `ollamaHost`| `"http://localhost:11434"` | Ollama server URL              |

## How It Works

1. **Parse** - Extracts structured data from unified diff format
2. **Analyze** - Sends diff to LLM with a specialized code review prompt
3. **Score** - Calculates weighted trust score across 5 categories
4. **Report** - Outputs results in your chosen format

Critical security issues have 5x the weight of low code-quality suggestions.

## License

MIT
