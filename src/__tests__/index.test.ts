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

    it("should handle renderJs option", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse),
      });

      await skrape.extract("https://example.com", testSchema, {
        renderJs: true,
      });

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.options.renderJs).toBe(true);
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

  describe("markdown", () => {
    const mockUrl = "https://example.com";
    const mockOptions = {
      renderJs: true,
      callbackUrl: "https://webhook.site/callback",
    };
    const mockResponse = {
      markdown: "# Example Page\n\nThis is a test page",
    };

    it("should make correct API request", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await skrape.markdown(mockUrl, mockOptions);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://skrape.ai/api/markdown",
        expect.objectContaining({
          method: "POST",
          headers: {
            Authorization: "Bearer test-key",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: mockUrl, options: mockOptions }),
        })
      );
    });

    it("should return markdown content", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await skrape.markdown(mockUrl, mockOptions);
      expect(result).toBe(mockResponse.markdown);
    });

    it("should handle API errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: {
          get: (header: string) => (header === "Retry-After" ? "60" : null),
        },
        json: () => Promise.resolve({ error: "Rate limit exceeded" }),
      });

      await expect(skrape.markdown(mockUrl, mockOptions)).rejects.toThrow(
        SkrapeError
      );
    });

    describe("bulk", () => {
      const mockUrls = ["https://example.com", "https://example.org"];
      const mockOptions = {
        renderJs: true,
        callbackUrl: "https://webhook.site/callback",
      };
      const mockResponse = {
        jobId: "job123",
        message: "Bulk conversion started",
      };

      it("should make correct API request", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        await skrape.markdown.bulk(mockUrls, mockOptions);

        expect(mockFetch).toHaveBeenCalledWith(
          "https://skrape.ai/api/markdown/bulk",
          expect.objectContaining({
            method: "POST",
            headers: {
              Authorization: "Bearer test-key",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ urls: mockUrls, options: mockOptions }),
          })
        );
      });

      it("should handle API errors", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: {
            get: (header: string) => (header === "Retry-After" ? "60" : null),
          },
          json: () => Promise.resolve({ error: "Rate limit exceeded" }),
        });

        await expect(
          skrape.markdown.bulk(mockUrls, mockOptions)
        ).rejects.toThrow(SkrapeError);
      });
    });
  });

  describe("crawl", () => {
    const mockUrls = ["https://example.com"];
    const mockOptions = {
      renderJs: true,
      maxDepth: 3,
      maxPages: 100,
      maxLinks: 50,
      linksOnly: false,
    };
    const mockResponse = {
      jobId: "job123",
      message: "Crawl started",
    };

    it("should make correct API request", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await skrape.crawl(mockUrls, mockOptions);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://skrape.ai/api/crawl",
        expect.objectContaining({
          method: "POST",
          headers: {
            Authorization: "Bearer test-key",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ urls: mockUrls, options: mockOptions }),
        })
      );
    });

    it("should handle API errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 402,
        json: () => Promise.resolve({ error: "Usage limit exceeded" }),
      });

      await expect(skrape.crawl(mockUrls, mockOptions)).rejects.toThrow(
        SkrapeError
      );
    });
  });

  describe("getJobStatus", () => {
    const mockJobId = "job123";
    const mockResponse = {
      status: "COMPLETED",
      output: { data: "test" },
      createdAt: "2024-01-01T00:00:00Z",
      isCompleted: true,
    };

    it("should make correct API request", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await skrape.getJobStatus(mockJobId);

      expect(mockFetch).toHaveBeenCalledWith(
        `https://skrape.ai/api/get-job?jobId=${mockJobId}`,
        expect.objectContaining({
          headers: {
            Authorization: "Bearer test-key",
          },
        })
      );
    });

    it("should return job status", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await skrape.getJobStatus(mockJobId);
      expect(result).toEqual(mockResponse);
    });

    it("should handle API errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: "Job not found" }),
      });

      await expect(skrape.getJobStatus(mockJobId)).rejects.toThrow(SkrapeError);
    });
  });

  describe("checkHealth", () => {
    const mockResponse = {
      status: "healthy",
      timestamp: "2024-01-01T00:00:00Z",
      environment: "production",
    };

    it("should make correct API request", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await skrape.checkHealth();

      expect(mockFetch).toHaveBeenCalledWith(
        "https://skrape.ai/api/health",
        expect.objectContaining({
          headers: {
            Authorization: `Bearer test-key`,
          },
        })
      );
    });

    it("should return health status", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await skrape.checkHealth();
      expect(result).toEqual(mockResponse);
    });

    it("should handle API errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Internal server error" }),
      });

      await expect(skrape.checkHealth()).rejects.toThrow(SkrapeError);
    });
  });
});
