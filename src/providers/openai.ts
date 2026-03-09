import OpenAI from 'openai';
import { LLMProvider } from '../types.js';

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;
  private model: string;

  constructor(model: string) {
    this.client = new OpenAI();
    this.model = model || 'gpt-4o';
  }

  async analyze(prompt: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: 'You are a senior code reviewer. Respond only with valid JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
    });

    return response.choices[0]?.message?.content ?? '{}';
  }
}