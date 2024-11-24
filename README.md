# Skrape

A TypeScript library for easy web scraping with Zod schemas.

## Installation

```bash
npm install skrape zod
```

## Usage

```typescript
import { Skrape } from "skrape";
import { z } from "zod";

// Initialize the client
const skrape = new Skrape({
  apiKey: "your-api-key",
});

// Define your schema using Zod
const productSchema = z.object({
  title: z.string(),
  price: z.number(),
  description: z.string(),
  rating: z.number().optional(),
});

// Extract data from a URL
async function scrapeProduct() {
  try {
    const product = await skrape.extract(
      "https://example.com/product",
      productSchema,
      { render_js: true } // Optional: Enable JavaScript rendering
    );

    console.log(product);
    // {
    //   title: "Product Name",
    //   price: 99.99,
    //   description: "Product description...",
    //   rating: 4.5
    // }
  } catch (error) {
    if (error instanceof SkrapeError) {
      console.error(`Error ${error.status}: ${error.message}`);
      if (error.retryAfter) {
        console.log(`Retry after ${error.retryAfter} seconds`);
      }
    }
  }
}
```

## Features

- Type-safe data extraction using Zod schemas
- Automatic conversion of Zod schemas to JSON Schema
- Built-in TypeScript support
- Error handling with retry information
- Optional JavaScript rendering support

## API Reference

### `new Skrape(options)`

Creates a new Skrape client.

Options:

- `apiKey` (required): Your API key
- `baseUrl` (optional): Custom API base URL

### `skrape.extract(url, schema, options?)`

Extracts data from a URL according to the provided schema.

Parameters:

- `url`: The URL to scrape
- `schema`: A Zod schema defining the data structure
- `options` (optional):
  - `render_js`: Enable JavaScript rendering (default: false)

Returns: A promise that resolves to the extracted data matching your schema.

## Error Handling

The library throws `SkrapeError` instances with the following properties:

- `message`: Error description
- `status`: HTTP status code
- `retryAfter`: Number of seconds to wait before retrying (for rate limit errors)

## License

ISC
