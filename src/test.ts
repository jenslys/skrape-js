import { Skrape } from './index';
import { z } from 'zod';

// Define a test schema
const testSchema = z.object({
  title: z.string(),
  description: z.string(),
  price: z.number().optional(),
});

async function test() {
  const skrape = new Skrape({
    apiKey: process.env.SKRAPE_API_KEY || '',
    baseUrl: process.env.SKRAPE_API_URL,
  });

  try {
    const result = await skrape.extract(
      'https://example.com',
      testSchema,
      { render_js: true }
    );
    
    console.log('Success! Extracted data:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Only run if this file is run directly
if (require.main === module) {
  test();
}
