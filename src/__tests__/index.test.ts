import { Skrape, SkrapeError } from "../index";
import { z } from "zod";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("Skrape", () => {
  let skrape: Skrape;

  beforeEach(() => {
    skrape = new Skrape({
      apiKey: "test-key",
    });
    mockFetch.mockClear();
  });

  describe("Constructor", () => {
    it("should create a Skrape instance", () => {
      expect(skrape).toBeInstanceOf(Skrape);
    });

    it("should throw error if apiKey is missing", () => {
      expect(() => new Skrape({} as any)).toThrow();
    });

    it("should have correct default baseUrl", () => {
      expect(skrape["baseUrl"]).toBe("https://skrape.ai/api");
    });

    it("should store API key and strip quotes", () => {
      const skrapeWithQuotes = new Skrape({ apiKey: '"test-key"' });
      expect(skrapeWithQuotes["apiKey"]).toBe("test-key");
    });

    it("should allow custom baseUrl", () => {
      const customSkrape = new Skrape({
        apiKey: "test-key",
        baseUrl: "https://custom.api",
      });
      expect(customSkrape["baseUrl"]).toBe("https://custom.api");
    });
  });

  describe("extract", () => {
    const testSchema = z.object({
      title: z.string(),
      price: z.number(),
    });

    const mockSuccessResponse = {
      result: {
        title: "Test Product",
        price: 99.99,
      },
    };

    it("should make correct API request", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse),
      });

      await skrape.extract("https://example.com", testSchema);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://skrape.ai/api/extract",
        expect.objectContaining({
          method: "POST",
          headers: {
            Authorization: "Bearer test-key",
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: expect.any(String),
        })
      );
    });

    it("should handle render_js option", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse),
      });

      await skrape.extract("https://example.com", testSchema, {
        render_js: true,
      });

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.options.render_js).toBe(true);
    });

    it("should parse successful response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse),
      });

      const result = await skrape.extract("https://example.com", testSchema);
      expect(result).toEqual(mockSuccessResponse.result);
    });

    it("should handle API errors with retry-after", async () => {
      const errorResponse = {
        ok: false,
        status: 429,
        headers: {
          get: (header: string) => (header === "Retry-After" ? "60" : null),
        },
        json: () => Promise.resolve({ error: "Rate limit exceeded" }),
      };

      mockFetch.mockResolvedValueOnce(errorResponse);

      try {
        await skrape.extract("https://example.com", testSchema);
        fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(SkrapeError);
        expect((error as SkrapeError).status).toBe(429);
        expect((error as SkrapeError).retryAfter).toBe(60);
        expect((error as SkrapeError).message).toBe("Rate limit exceeded");
      }
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      try {
        await skrape.extract("https://example.com", testSchema);
        fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(SkrapeError);
        expect((error as SkrapeError).status).toBe(500);
        expect((error as SkrapeError).message).toBe("Network error");
      }
    });
  });

  describe("Schema Validation", () => {
    it("should validate schema conversion", async () => {
      const complexSchema = z.object({
        user: z.object({
          name: z.string(),
          age: z.number().min(0),
          email: z.string().email(),
        }),
        orders: z.array(
          z.object({
            id: z.string(),
            total: z.number(),
          })
        ),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            result: {
              user: {
                name: "John",
                age: 30,
                email: "john@example.com",
              },
              orders: [
                { id: "1", total: 99.99 },
                { id: "2", total: 149.99 },
              ],
            },
          }),
      });

      const result = await skrape.extract("https://example.com", complexSchema);
      expect(result.user.name).toBe("John");
      expect(result.orders).toHaveLength(2);
    });
  });

  describe("SkrapeError", () => {
    it("should create SkrapeError with status and retry-after", () => {
      const error = new SkrapeError("Rate limit exceeded", 429, 60);
      expect(error).toBeInstanceOf(SkrapeError);
      expect(error.message).toBe("Rate limit exceeded");
      expect(error.status).toBe(429);
      expect(error.retryAfter).toBe(60);
      expect(error.name).toBe("SkrapeError");
    });
  });
});
