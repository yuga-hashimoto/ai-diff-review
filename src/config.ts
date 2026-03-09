import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { Config } from './types.js';

const DEFAULT_CONFIG: Config = {
  provider: 'ollama',
  model: 'codellama:13b',
  threshold: 70,
};

const SEARCH_PATHS = [
  '.ai-diff-review.json',
  '.ai-diff-reviewrc.json',
  'ai-diff-review.config.json',
];

/**
 * Load configuration from a file path or search common locations.
 * Falls back to defaults for any missing fields.
 */
export function loadConfig(configPath?: string): Config {
  const paths = configPath ? [configPath] : SEARCH_PATHS;

  for (const p of paths) {
    const resolved = resolve(p);
    if (existsSync(resolved)) {
      try {
        const raw = JSON.parse(readFileSync(resolved, 'utf-8'));
        return mergeConfig(raw);
      } catch {
        // Ignore malformed config, use defaults
      }
    }
  }

  return { ...DEFAULT_CONFIG };
}

function mergeConfig(raw: Record<string, unknown>): Config {
  return {
    provider: isValidProvider(raw.provider) ? raw.provider : DEFAULT_CONFIG.provider,
    model: typeof raw.model === 'string' ? raw.model : DEFAULT_CONFIG.model,
    threshold: typeof raw.threshold === 'number' ? raw.threshold : DEFAULT_CONFIG.threshold,
    apiKey: typeof raw.apiKey === 'string' ? raw.apiKey : undefined,
    ollamaHost: typeof raw.ollamaHost === 'string' ? raw.ollamaHost : undefined,
    rules: Array.isArray(raw.rules) ? raw.rules.filter((r): r is string => typeof r === 'string') : undefined,
    ignorePatterns: Array.isArray(raw.ignorePatterns) ? raw.ignorePatterns.filter((p): p is string => typeof p === 'string') : undefined,
  };
}

function isValidProvider(v: unknown): v is Config['provider'] {
  return v === 'openai' || v === 'ollama' || v === 'anthropic';
}
