import { config } from '../config/env.config';

export class GroqClientService {
  /**
   * Raw Groq API call wrapper only.
   * TODO: Implement Groq API invocation
   */
  async callGroq(prompt: string, systemPrompt: string): Promise<string> {
    // TODO: Implement Groq API chat completion call
    return '';
  }
}

export const groqClientService = new GroqClientService();
