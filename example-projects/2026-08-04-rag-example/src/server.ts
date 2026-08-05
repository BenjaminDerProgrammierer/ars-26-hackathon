import { readFile } from "node:fs/promises";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { answerQuestion, INSUFFICIENT_INFORMATION, OpenRouterGenerationProvider } from "./answer.js";
import { numberEnvironment, positiveIntegerEnvironment, requiredEnvironment } from "./io.js";
import { retrieve } from "./search.js";
import type { SearchResult } from "./types.js";

const publicDirectory = fileURLToPath(new URL("../public/", import.meta.url));
const maximumRequestBytes = 16_384;
const maximumQuestionLength = 1_000;

export type PublicSource = {
  number: number;
  title: string;
  category: string | null;
  location: string | null;
  language: "en" | "de";
  score: number;
  url: string | null;
};

export type RagResponse = {
  answer: string;
  sources: PublicSource[];
};

type AnswerRequest = (question: string) => Promise<RagResponse>;

function safePublicUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

function publicSources(results: SearchResult[]): PublicSource[] {
  return results.map(({ document, score }, index) => ({
    number: index + 1,
    title: document.title,
    category: document.category,
    location: document.location,
    language: document.language,
    score,
    url: document.linkAllowed ? safePublicUrl(document.url) : null,
  }));
}

export async function runRagQuestion(question: string): Promise<RagResponse> {
  const results = await retrieve(question);
  if (results.length === 0) return { answer: INSUFFICIENT_INFORMATION, sources: [] };
  const model = process.env.OPENROUTER_GENERATION_MODEL?.trim() || "mistralai/mistral-medium-3-5";
  const provider = new OpenRouterGenerationProvider({
    apiKey: requiredEnvironment("OPENROUTER_API_KEY"),
    model,
  });
  return {
    answer: await answerQuestion(question, results, provider),
    sources: publicSources(results),
  };
}

function securityHeaders(): Record<string, string> {
  return {
    "Content-Security-Policy": "default-src 'self'; base-uri 'none'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self'; object-src 'none'; script-src 'self'; style-src 'self'",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
  };
}

function sendJson(response: ServerResponse, status: number, value: unknown): void {
  response.writeHead(status, {
    ...securityHeaders(),
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(value));
}

async function requestBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > maximumRequestBytes) throw new Error("REQUEST_TOO_LARGE");
    chunks.push(buffer);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch {
    throw new Error("INVALID_JSON");
  }
}

function questionFrom(value: unknown): string {
  if (!value || typeof value !== "object" || !("question" in value) || typeof value.question !== "string") {
    throw new Error("QUESTION_REQUIRED");
  }
  const question = value.question.trim();
  if (!question) throw new Error("QUESTION_REQUIRED");
  if (question.length > maximumQuestionLength) throw new Error("QUESTION_TOO_LONG");
  return question;
}

async function handleApi(request: IncomingMessage, response: ServerResponse, answer: AnswerRequest): Promise<void> {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendJson(response, 405, { error: "Use POST for this endpoint." });
    return;
  }
  try {
    sendJson(response, 200, await answer(questionFrom(await requestBody(request))));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "REQUEST_TOO_LARGE" || message === "QUESTION_TOO_LONG") {
      sendJson(response, 413, { error: "Keep the question under 1,000 characters." });
    } else if (message === "INVALID_JSON" || message === "QUESTION_REQUIRED") {
      sendJson(response, 400, { error: "Enter a question before searching." });
    } else {
      console.error(error);
      sendJson(response, 500, { error: message });
    }
  }
}

const staticFiles = new Map([
  ["/", { name: "index.html", type: "text/html; charset=utf-8" }],
  ["/app.js", { name: "app.js", type: "text/javascript; charset=utf-8" }],
  ["/styles.css", { name: "styles.css", type: "text/css; charset=utf-8" }],
]);

async function handleRequest(request: IncomingMessage, response: ServerResponse, answer: AnswerRequest): Promise<void> {
  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
  if (pathname === "/api/ask") {
    await handleApi(request, response, answer);
    return;
  }
  const file = staticFiles.get(pathname);
  if (!file || (request.method !== "GET" && request.method !== "HEAD")) {
    sendJson(response, 404, { error: "Not found." });
    return;
  }
  const content = await readFile(resolve(publicDirectory, file.name));
  response.writeHead(200, {
    ...securityHeaders(),
    "Cache-Control": "no-cache",
    "Content-Type": file.type,
  });
  response.end(request.method === "HEAD" ? undefined : content);
}

export function createRagServer(answer: AnswerRequest = runRagQuestion): Server {
  return createServer((request, response) => {
    handleRequest(request, response, answer).catch((error: unknown) => {
      console.error(error);
      if (!response.headersSent) sendJson(response, 500, { error: "The web server could not complete the request." });
      else response.end();
    });
  });
}

async function main(): Promise<void> {
  const port = positiveIntegerEnvironment("PORT", 3000);
  const host = process.env.HOST?.trim() || "127.0.0.1";
  numberEnvironment("RAG_MIN_SIMILARITY", 0.25);
  const server = createRagServer();
  server.listen(port, host, () => {
    console.log(`Ars Festival RAG UI is available at http://${host}:${port}`);
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
