import { Skrape, SkrapeError } from "./index";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.SKRAPE_API_KEY;
if (!apiKey) {
  throw new Error("SKRAPE_API_KEY is required");
}

const skrape = new Skrape({
  apiKey,
  baseUrl: "http://localhost:3000/api",
});

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
  try {
    const result = await skrape.extract(
      "https://news.ycombinator.com",
      newsSchema
    );
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    if (error instanceof SkrapeError) {
      console.error("SkrapeError:", error.message);
      console.error("Status:", error.status);
      if (error.retryAfter) {
        console.error("Retry after:", error.retryAfter, "seconds");
      }
    } else {
      console.error("Error:", error);
    }
  }
}

test();
