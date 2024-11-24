# Skrape JS

A TypeScript library for easily interacting with Skrape.ai API. Define your scraping schema using Zod and get type-safe results.

## Features

- **Type-safe**: Define your schemas using Zod and get fully typed results
- **Simple API**: Just define a schema and get your data
- **Lightweight**: Zero runtime dependencies (except for Zod)
- **Secure**: No API keys in your code, uses environment variables
- **Flexible**: Support for JavaScript rendering and custom options

## Installation

```bash
# Using npm
npm install skrape-js zod

# Using yarn
yarn add skrape-js zod

# Using bun
bun add skrape-js zod

# Using pnpm
pnpm add skrape-js zod

```

## Quick Start

```typescript
import { Skrape } from "skrape-js";
import { z } from "zod";

// Initialize the client
const skrape = new Skrape({
  apiKey: process.env.SKRAPE_API_KEY,
});

// Define your schema using Zod
const newsSchema = z.object({
  topStories: z
    .array(
      z.object({
        title: z.string(),
        url: z.string(),
        score: z.number(),
        author: z.string(),
        commentCount: z.number(),
      })
    )
    .max(3),
});

// Extract data
const result = await skrape.extract(
  "https://news.ycombinator.com",
  newsSchema,
  { render_js: false }
);

console.log(result.topStories);
// [
//   {
//     title: "Example HN Post",
//     url: "https://example.com",
//     score: 100,
//     author: "user123",
//     commentCount: 25
//   },
//   ...
// ]
```

## Schema Definition

The library uses [Zod](https://zod.dev) for schema definition. Zod is a TypeScript-first schema declaration and validation library that lets you define complex data structures. Here's what you can do:

```typescript
import { z } from "zod";

// Simple object
z.object({
  title: z.string(),
  views: z.number(),
});

// Arrays with validation
z.array(z.string()).min(1).max(10);

// Optional fields
z.object({
  title: z.string(),
  subtitle: z.string().optional(),
});

// Complex nested structures
z.object({
  articles: z.array(
    z.object({
      title: z.string(),
      tags: z.array(z.string()),
      metadata: z.object({
        published: z.boolean(),
        date: z.string().datetime(),
      }),
    })
  ),
});

// Learn more at https://zod.dev
```

## API Reference

### `new Skrape(options)`

Creates a new Skrape client.

Options:

- `apiKey` (required): Your Skrape API key

### `skrape.extract(url, schema, options?)`

Extracts data from a URL according to the provided schema.

Parameters:

- `url`: The URL to scrape
- `schema`: A Zod schema defining the data structure
- `options`:
  - `render_js`: Enable JavaScript rendering (default: false)

Returns: A promise that resolves to the extracted data matching your schema.

## Error Handling

The library throws `SkrapeError` instances with the following properties:

- `message`: Error description
- `status`: HTTP status code
- `retryAfter`: Number of seconds to wait before retrying (for rate limit errors)

Example error handling:

```typescript
try {
  const data = await skrape.extract(url, schema);
} catch (error) {
  if (error instanceof SkrapeError) {
    console.log(error.message); // Error message
    console.log(error.status); // HTTP status code
    console.log(error.retryAfter); // Retry-After value if rate limited
  }
}
```

## License

MIT License

Copyright (c) 2024 Jens Lystad

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
