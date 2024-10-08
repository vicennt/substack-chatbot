import { generateObject, tool } from "ai";
import Parser from "rss-parser";
import * as cheerio from "cheerio";
import { z } from "zod";
import { openai } from "@ai-sdk/openai";

export const tools = {
  get_substack_feed: tool({
    description: "Get the latest posts from a Substack feed.",
    parameters: z.object({
      url: z.string().describe("The URL of the Substack feed."),
    }),
    execute: async ({ url }) => {
      const feed = await getFeedContent(url);
      return { feed };
    },
  }),
  get_number_of_posts: tool({
    description: "Get the number of posts from a Substack feed.",
    parameters: z.object({
      url: z.string().describe("The URL of the Substack feed."),
    }),
    execute: async ({ url }) => {
      const feed = await getFeedContent(url);
      return { numberOfPosts: feed.posts.length };
    },
  }),
  get_substack_post_summary: tool({
    description: "Get a summary of a specific Substack post by its title.",
    parameters: z.object({
      url: z.string().describe("The URL of the Substack feed."),
    }),
    execute: async ({ url }) => {
      const post = await getPostContent(url);
      return { post };
    },
  }),
  get_substack_post_resources: tool({
    description:
      "Get a list of resources from a specific Substack post by its content.",
    parameters: z.object({
      url: z.string().describe("The URL of the Substack post"),
      numberOfResources: z
        .number()
        .describe("The total number of resources that you want to extract"),
    }),
    execute: async ({ url, numberOfResources }) => {
      const html: any = await getPostContentHtml(url);
      const $ = cheerio.load(html);
      const anchors = $("a")
        .map((_, el) => ({
          text: $(el).text(),
          href: $(el).attr("href"),
        }))
        .get();
      const { object } = await generateObject({
        model: openai("gpt-3.5-turbo"),
        schema: z.object({
          resources: z.array(
            z.object({
              name: z.string(),
              description: z.string(),
              link: z.string().url().optional(),
              type: z.enum(["podcast", "book", "tool", "person", "other"]),
            }),
          ),
        }),
        prompt: `Given the following list of anchors from a Substack post, extract an array of ${numberOfResources} resources mentioned. 
                 Each resource should have a name, description, optional link, and type (podcast, book, tool, person, or other).
                 Only include resources that are relevant and meaningful. The description should be a concise summary of the resource and not to short
                 Anchors: ${JSON.stringify(anchors)},
                 )}`,
      });
      return { resources: object.resources };
    },
  }),
};

const getFeedContent = async (url: string) => {
  console.log("Getting feed content for", url);
  const parser = new Parser();
  const feedUrl = `${url}feed`;
  // Add a cache-busting query parameter
  const cacheBuster = new Date().getTime();
  const { items } = await parser.parseURL(`${feedUrl}?_=${cacheBuster}`);
  const posts = items.map((item: any) => ({
    title: item.title,
    link: item.link,
  }));
  return { posts };
};

export const scrapeWebPage = async (url: string) => {
  if (!url) return;
  const response = await fetch(url);
  return response.text();
};

export const getPostContent = async (url: string) => {
  const html = await scrapeWebPage(url);
  if (!html) return;
  const $ = cheerio.load(html);
  const content = $(".available-content").text() || "";
  console.log("content", content);
  return { content };
};

export const getPostContentHtml = async (url: string) => {
  const html = await scrapeWebPage(url);
  if (!html) return;
  const $ = cheerio.load(html);
  return $(".available-content").html();
};
