import { OpenRouter } from "@openrouter/sdk";
import type { EmbeddingProvider } from "./types.js";

type EmbeddingResponse = {
  data: Array<{ embedding: number[] | string; index?: number }>;
};
type RequestEmbeddings = (texts: string[], inputType?: string) => Promise<unknown>;

function statusCode(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  if ("statusCode" in error && typeof error.statusCode === "number") return error.statusCode;
  if ("status" in error && typeof error.status === "number") return error.status;
  return undefined;
}

function isTransient(error: unknown): boolean {
  const status = statusCode(error);
  return status === 408 || status === 409 || status === 429 || (status !== undefined && status >= 500);
}

export function validateEmbeddingResponse(value: unknown, expectedCount: number): number[][] {
  if (!value || typeof value !== "object" || !("data" in value) || !Array.isArray(value.data)) {
    throw new Error("OpenRouter returned an invalid embedding response");
  }
  const response = value as EmbeddingResponse;
  const ordered = response.data.every((item) => typeof item.index === "number")
    ? [...response.data].sort((left, right) => (left.index ?? 0) - (right.index ?? 0))
    : response.data;
  if (ordered.length !== expectedCount) {
    throw new Error(`OpenRouter returned ${ordered.length} vectors for ${expectedCount} inputs`);
  }
  const vectors = ordered.map(({ embedding }) => {
    if (!Array.isArray(embedding) || embedding.length === 0 || embedding.some((item) => !Number.isFinite(item))) {
      throw new Error("OpenRouter returned a non-numeric or empty embedding vector");
    }
    return embedding;
  });
  const dimensions = vectors[0]?.length;
  if (!dimensions || vectors.some((vector) => vector.length !== dimensions)) {
    throw new Error("OpenRouter returned embedding vectors with inconsistent dimensions");
  }
  return vectors;
}

export class OpenRouterEmbeddingProvider implements EmbeddingProvider {
  readonly model: string;
  private readonly request: RequestEmbeddings;
  private readonly batchSize: number;
  private readonly retries: number;
  private readonly wait: (milliseconds: number) => Promise<void>;

  constructor(options: {
    apiKey?: string;
    model: string;
    batchSize?: number;
    retries?: number;
    request?: RequestEmbeddings;
    wait?: (milliseconds: number) => Promise<void>;
  }) {
    this.model = options.model;
    this.batchSize = options.batchSize ?? 32;
    this.retries = options.retries ?? 3;
    this.wait = options.wait ?? ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
    if (options.request) {
      this.request = options.request;
    } else {
      if (!options.apiKey) throw new Error("OPENROUTER_API_KEY is required");
      const client = new OpenRouter({ apiKey: options.apiKey, appTitle: "Ars Festival RAG Example" });
      this.request = (texts, inputType) =>
        client.embeddings.generate({
          requestBody: {
            model: this.model,
            input: texts,
            ...(inputType ? { inputType } : {}),
          },
        });
    }
  }

  private async requestWithRetry(texts: string[], inputType?: string): Promise<number[][]> {
    for (let attempt = 0; ; attempt += 1) {
      try {
        return validateEmbeddingResponse(await this.request(texts, inputType), texts.length);
      } catch (error: unknown) {
        if (attempt >= this.retries || !isTransient(error)) throw error;
        await this.wait(250 * 2 ** attempt);
      }
    }
  }

  async embed(texts: string[], inputType?: "search_document" | "search_query"): Promise<number[][]> {
    if (texts.length === 0) return [];
    if (texts.some((item) => !item.trim())) throw new Error("Embedding inputs must not be empty");
    const vectors: number[][] = [];
    for (let start = 0; start < texts.length; start += this.batchSize) {
      vectors.push(...(await this.requestWithRetry(texts.slice(start, start + this.batchSize), inputType)));
    }
    const dimensions = vectors[0]?.length;
    if (!dimensions || vectors.some((vector) => vector.length !== dimensions)) {
      throw new Error("Embedding batches returned inconsistent vector dimensions");
    }
    return vectors;
  }
}
