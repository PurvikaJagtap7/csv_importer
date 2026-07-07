import { config } from '../config/env.config';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'openai/gpt-oss-120b';

export class GroqClientService {
  /**
   * Calls the Groq chat completions API with a system prompt and a batch of raw rows.
   * Returns the parsed JSON array from the response.
   */
  async callGroq(systemPrompt: string, batchRows: any[]): Promise<any[]> {
    const apiKey = config.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not set in environment config.');
    }

    const userMessage = JSON.stringify(batchRows, null, 2);

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Groq API error ${response.status}: ${errorBody}`);
    }

    const json = await response.json() as any;
    const content: string = json?.choices?.[0]?.message?.content ?? '[]';

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error(`Failed to parse Groq response as JSON: ${content}`);
    }

    // The model returns { records: [...] } or directly an array
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (parsed && Array.isArray(parsed.records)) {
      return parsed.records;
    }

    throw new Error(`Unexpected Groq response shape: ${content}`);
  }
}

export const groqClientService = new GroqClientService();
