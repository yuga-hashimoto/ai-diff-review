import { LLMProvider, Config } from '../types.js';

/**
 * OpenAI-compatible provider (works with OpenAI API)
 */
class OpenAIProvider implements LLMProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async analyze(prompt: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errorBody}`);
    }

    const data = await response.json() as any;
    return data.choices?.[0]?.message?.content ?? '';
  }
}

/**
 * Ollama local provider
 */
class OllamaProvider implements LLMProvider {
  private host: string;
  private model: string;

  constructor(host: string, model: string) {
    this.host = host;
    this.model = model;
  }

  async analyze(prompt: string): Promise<string> {
    const response = await fetch(`${this.host}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        prompt,
        stream: false,
        options: { temperature: 0.1 },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error (${response.status}): ${await response.text()}`);
    }

    const data = await response.json() as any;
    return data.response ?? '';
  }
}

/**
 * Anthropic Claude provider
 */
class AnthropicProvider implements LLMProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async analyze(prompt: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error (${response.status}): ${await response.text()}`);
    }

    const data = await response.json() as any;
    return data.content?.[0]?.text ?? '';
  }
}

/**
 * Create an LLM provider from config
 */
export function createProvider(config: Config): LLMProvider {
  switch (config.provider) {
    case 'openai': {
      const apiKey = config.apiKey ?? process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OpenAI API key required. Set OPENAI_API_KEY env var or apiKey in config.');
      }
      return new OpenAIProvider(apiKey, config.model || 'gpt-4o-mini');
    }

    case 'anthropic': {
      const apiKey = config.apiKey ?? process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error('Anthropic API key required. Set ANTHROPIC_API_KEY env var or apiKey in config.');
      }
      return new AnthropicProvider(apiKey, config.model || 'claude-sonnet-4-20250514');
    }

    case 'ollama':
    default: {
      const host = config.ollamaHost ?? process.env.OLLAMA_HOST ?? 'http://localhost:11434';
      return new OllamaProvider(host, config.model || 'codellama:13b');
    }
  }
}
