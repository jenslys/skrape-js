# Skrape JS

A TypeScript library for easily interacting with Skrape.ai API. Define your scraping schema using Zod and get type-safe results.

## Features

- **Type-safe**: Define your schemas using Zod and get fully typed results
- **Simple API**: Just define a schema and get your data
- **Minimal Dependencies**: Only requires Zod as a peer dependency
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

Note: `zod` is a peer dependency and must be installed alongside `skrape-js`.

## Environment Setup

Create a `.env` file in your project root:

```env
SKRAPE_API_KEY=your_api_key_here
```

Make sure to add `.env` to your `.gitignore` to keep your API key secure.

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
      content: z.string(),
      metadata: z.object({
        author: z.string(),
        publishDate: z.string(),
      }),
    })
  ),
});
```

## API Options

When calling `extract()`, you can pass additional options:

```typescript
const result = await skrape.extract(url, schema, {
  render_js: true, // Enable JavaScript rendering
  wait_for: 2000, // Wait 2 seconds after page load
  // ... other Skrape.ai options
});
```

## Error Handling

The library throws typed errors that you can catch and handle:

```typescript
try {
  const result = await skrape.extract(url, schema);
} catch (error) {
  if (error instanceof SkrapeValidationError) {
    // Schema validation failed
    console.error("Data doesn't match schema:", error.message);
  } else if (error instanceof SkrapeAPIError) {
    // API request failed
    console.error("API error:", error.message);
  }
}
```

## TypeScript Support

The library is written in TypeScript and provides full type inference. Your IDE will automatically show you the correct types based on your Zod schema:

```typescript
const schema = z.object({
  title: z.string(),
  count: z.number(),
});

const result = await skrape.extract(url, schema);
// result.title is typed as string
// result.count is typed as number
```

## License

MIT
