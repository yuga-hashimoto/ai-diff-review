#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { parseDiff } from './parser.js';
import { analyzeDiff } from './analyzer.js';
import { formatResult } from './formatters.js';

const VERSION = '1.0.0';

interface CLIOptions {
  format: 'text' | 'json' | 'markdown';
  staged: boolean;
  file: string | null;
  ref: string | null;
  verbose: boolean;
}

function parseArgs(args: string[]): CLIOptions {
  const opts: CLIOptions = {
    format: 'text',
    staged: false,
    file: null,
    ref: null,
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--format':
      case '-f':
        opts.format = (args[++i] as CLIOptions['format']) || 'text';
        break;
      case '--staged':
      case '-s':
        opts.staged = true;
        break;
      case '--file':
        opts.file = args[++i] || null;
        break;
      case '--ref':
      case '-r':
        opts.ref = args[++i] || null;
        break;
      case '--verbose':
      case '-v':
        opts.verbose = true;
        break;
      case '--version':
        console.log(`ai-diff-review v${VERSION}`);
        process.exit(0);
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
    }
  }

  return opts;
}

function printHelp(): void {
  console.log(`
ai-diff-review v${VERSION}
AI-powered trust scoring for code changes

USAGE:
  ai-diff-review [options]
  git diff | ai-diff-review
  cat changes.patch | ai-diff-review

OPTIONS:
  --staged, -s       Analyze staged changes (git diff --cached)
  --ref, -r <ref>    Analyze diff against a git ref (branch, commit, tag)
  --file <path>      Read diff from a file instead of stdin/git
  --format, -f <fmt> Output format: text (default), json, markdown
  --verbose, -v      Show detailed analysis info
  --version          Show version
  --help, -h         Show this help

ENVIRONMENT:
  OPENAI_API_KEY     Required for OpenAI provider
  OLLAMA_HOST        Ollama server URL (default: http://localhost:11434)

CONFIG:
  Create .ai-diff-review.json in your project root:
  {
    "provider": "ollama",
    "model": "codellama:13b",
    "threshold": 70
  }

EXAMPLES:
  # Score staged changes
  ai-diff-review --staged

  # Compare against main branch
  ai-diff-review --ref main

  # Pipe from git diff
  git diff HEAD~3 | ai-diff-review --format json

  # Read from patch file
  ai-diff-review --file changes.patch --format markdown
`);
}

function getDiffInput(opts: CLIOptions): string {
  // 1. From file
  if (opts.file) {
    try {
      return readFileSync(opts.file, 'utf-8');
    } catch (err) {
      console.error(`Error: Cannot read file '${opts.file}'`);
      process.exit(1);
    }
  }

  // 2. From git
  if (opts.staged || opts.ref) {
    try {
      const cmd = opts.staged
        ? 'git diff --cached'
        : `git diff ${opts.ref}`;
      return execSync(cmd, { encoding: 'utf-8' });
    } catch {
      console.error('Error: Failed to run git diff. Are you in a git repository?');
      process.exit(1);
    }
  }

  // 3. From stdin (piped)
  if (!process.stdin.isTTY) {
    try {
      return readFileSync('/dev/stdin', 'utf-8');
    } catch {
      console.error('Error: Failed to read from stdin');
      process.exit(1);
    }
  }

  // 4. Default: unstaged changes
  try {
    const diff = execSync('git diff', { encoding: 'utf-8' });
    if (!diff.trim()) {
      console.error('No changes detected. Use --staged for staged changes or --ref <branch> to compare.');
      process.exit(0);
    }
    return diff;
  } catch {
    console.error('Error: Not a git repository or git is not installed.');
    process.exit(1);
  }
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.verbose) {
    console.error('[ai-diff-review] Starting analysis...');
  }

  const diffInput = getDiffInput(opts);
  const files = parseDiff(diffInput);

  if (files.length === 0) {
    console.error('No diff content to analyze.');
    process.exit(0);
  }

  if (opts.verbose) {
    console.error(`[ai-diff-review] Parsed ${files.length} file(s)`);
  }

  try {
    const result = await analyzeDiff(files);
    const output = formatResult(result, opts.format);
    console.log(output);

    // Exit with non-zero if score below threshold
    const config = await import('./config.js');
    const cfg = config.loadConfig();
    if (result.trustScore.overall < cfg.threshold) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Analysis failed:', err instanceof Error ? err.message : err);
    process.exit(2);
  }
}

main();
