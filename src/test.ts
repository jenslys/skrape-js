import { Skrape, SkrapeError } from "./index";
import { z } from "zod";

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

async function test() {
  if (!process.env.SKRAPE_API_KEY) {
    console.error("Error: SKRAPE_API_KEY environment variable is not set");
    process.exit(1);
  }

  const skrape = new Skrape({
    apiKey: process.env.SKRAPE_API_KEY,
    baseUrl: "http://localhost:3000/api",
  });

  try {
    const result = await skrape.extract(
      "https://news.ycombinator.com/",
      newsSchema,
      { render_js: false }
    );

    console.log("Extracted data:", JSON.stringify(result, null, 2));
  } catch (error) {
    if (error instanceof SkrapeError) {
      console.error(`Error ${error.status}: ${error.message}`);
      if (error.retryAfter) {
        console.error(`Rate limited. Retry after ${error.retryAfter} seconds`);
      }
    } else {
      console.error("Unexpected error:", error);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  test();
}
