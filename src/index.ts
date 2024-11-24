import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export interface SkrapeOptions {
  apiKey: string;
  baseUrl?: string;
}

export interface ExtractOptions {
  render_js?: boolean;
}

export class SkrapeError extends Error {
  constructor(
    message: string,
    public status?: number,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'SkrapeError';
  }
}

export class Skrape {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(options: SkrapeOptions) {
    this.baseUrl = options.baseUrl || 'https://api.skrape.ai';
    this.apiKey = options.apiKey;
  }

  async extract<T extends z.ZodType>(
    url: string,
    schema: T,
    options?: ExtractOptions
  ): Promise<z.infer<T>> {
    const jsonSchema = zodToJsonSchema(schema, { name: 'Schema' });

    const response = await fetch(`${this.baseUrl}/extract`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        schema: jsonSchema,
        options,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      const retryAfter = response.headers.get('Retry-After');
      
      throw new SkrapeError(
        error.error || 'Request failed',
        response.status,
        retryAfter ? parseInt(retryAfter, 10) : undefined
      );
    }

    const data = await response.json();
    return data.result as z.infer<T>;
  }
}

// Export type utilities
export type InferSkrapeSchema<T extends z.ZodType> = z.infer<T>;
