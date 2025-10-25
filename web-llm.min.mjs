npm i @built-in-ai/web-llm
import { streamText } from "ai";
import { webLLM } from "@built-in-ai/web-llm";

const result = streamText({
  // or generateText
  model: webLLM("Llama-3.2-3B-Instruct-q4f16_1-MLC"),
  messages: [{ role: "user", content: "Hello, how are you?" }],
});

for await (const chunk of result.textStream) {
  console.log(chunk);
}