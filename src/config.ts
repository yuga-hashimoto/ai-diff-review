import { cosmiconfig } from 'cosmiconfig';

export interface Config {
  model?: string;
  provider?: string;
  threshold?: string;
  rules?: string[];
  ignorePatterns?: string[];
}

export async function loadConfig(configPath?: string): Promise<Config> {
  const explorer = cosmiconfig('ai-diff-review', {
    searchPlaces: [
      '.ai-diff-review.json',
      '.ai-diff-review.yaml',
      '.ai-diff-review.yml',
      '.ai-diff-reviewrc',
      '.ai-diff-reviewrc.json',
      '.ai-diff-reviewrc.yaml',
      'ai-diff-review.config.js',
      'ai-diff-review.config.ts',
      'package.json',
    ],
  });

  try {
    const result = configPath
      ? await explorer.load(configPath)
      : await explorer.search();
    return result?.config ?? {};
  } catch {
    return {};
  }
}