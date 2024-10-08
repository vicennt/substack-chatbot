import { openai } from "@ai-sdk/openai";
import { streamText, convertToCoreMessages } from "ai";
import { tools } from "./functions";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: openai("gpt-3.5-turbo-1106"),
    messages: convertToCoreMessages(messages),
    tools: tools,
  });

  return result.toDataStreamResponse();
}
