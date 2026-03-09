import { LLMProvider } from '../types.js';
import { OllamaProvider } from './ollama.js';
import { OpenAIProvider } from './openai.js';

export function createProvider(provider: string, model: string): LLMProvider {
  switch (provider) {
    case 'ollama':
      return new OllamaProvider(model);
    case 'openai':
      return new OpenAIProvider(model);
    case 'anthropic':
      return new OpenAIProvider(model);
    default:
      return new OllamaProvider(model);
  }
}