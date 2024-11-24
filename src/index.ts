import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

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
    this.name = "SkrapeError";
  }
}

export class Skrape {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(options: SkrapeOptions) {
    this.baseUrl = options.baseUrl || "https://skrape.ai/api";
    this.apiKey = options.apiKey.replace(/["']/g, "");
  }

  private convertToJsonSchema(schema: z.ZodType) {
    const fullSchema = zodToJsonSchema(schema);
    if (
      typeof fullSchema === "object" &&
      fullSchema.definitions &&
      "Schema" in fullSchema.definitions
    ) {
      return fullSchema.definitions.Schema;
    }
    return fullSchema;
  }

  async extract<T extends z.ZodType>(
    url: string,
    schema: T,
    options?: ExtractOptions
  ): Promise<z.infer<T>> {
    const jsonSchema = this.convertToJsonSchema(schema);

    try {
      const response = await fetch(`${this.baseUrl}/extract`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          url,
          schema: jsonSchema,
          options,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new SkrapeError(
          data.error || "Request failed",
          response.status,
          response.headers.get("Retry-After")
            ? parseInt(response.headers.get("Retry-After")!, 10)
            : undefined
        );
      }

      return data.result as z.infer<T>;
    } catch (error) {
      if (error instanceof SkrapeError) {
        throw error;
      }
      throw new SkrapeError(
        error instanceof Error ? error.message : "Unknown error occurred",
        500
      );
    }
  }
}

export type InferSkrapeSchema<T extends z.ZodType> = z.infer<T>;
