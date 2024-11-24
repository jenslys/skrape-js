# skrape-js

A TypeScript library for easily interacting with Skrape.ai API. Define your scraping schema using Zod and get type-safe results.

## Features

- 🛡️ **Type-safe**: Define your schemas using Zod and get fully typed results
- 🚀 **Simple API**: Just define a schema and get your data
- 🧩 **Minimal Dependencies**

## Installation

```bash
# Using npm
npm install skrape-js zod

# Using yarn, pnpm, etc.
yarn/pnpm/bun add skrape-js zod
```

Note: `zod` is a peer dependency and must be installed alongside `skrape-js`.

## Environment Setup

Setup your API key in `.env`:

```env
SKRAPE_API_KEY="your_api_key_here"
```

<small>Get your API key on [Skrape.ai](https://skrape.ai)</small>

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

We leverage [Zod](https://zod.dev) for defining schemas. For a comprehensive understanding of all available options and advanced schema configurations, we recommend exploring Zod's documentation.

## API Options

When calling `extract()`, you can pass additional options:

```typescript
const result = await skrape.extract(url, schema, {
  render_js: true, // Enable JavaScript rendering
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
