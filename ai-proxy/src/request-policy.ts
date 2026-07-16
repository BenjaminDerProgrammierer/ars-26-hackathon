import { z } from "zod";

const requestSchema = z
  .object({
    model: z.string().optional(),
    messages: z.array(z.unknown()).min(1),
    stream: z.boolean().optional(),
    max_tokens: z.number().int().positive().optional(),
    max_completion_tokens: z.number().int().positive().optional(),
  })
  .passthrough();

export class InvalidProxyRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidProxyRequestError";
  }
}

function assertTextOnly(value: unknown): void {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const item of value) assertTextOnly(item);
    return;
  }

  const record = value as Record<string, unknown>;
  if (record.type === "image_url" || record.type === "input_image" || record.type === "image") {
    throw new InvalidProxyRequestError(
      "This prototype accepts text requests only so the $20 limit can be reserved safely.",
    );
  }
  for (const nested of Object.values(record)) assertTextOnly(nested);
}

export function applyRequestPolicy(
  input: unknown,
  options: {
    model: string;
    maxOutputTokens: number;
    inputNanoUsdPerToken: number;
    outputNanoUsdPerToken: number;
  },
) {
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) {
    throw new InvalidProxyRequestError("Invalid OpenAI chat completions request");
  }

  if (parsed.data.model && parsed.data.model !== options.model && parsed.data.model !== "hackathon-model") {
    throw new InvalidProxyRequestError(`Only ${options.model} is available`);
  }
  assertTextOnly(parsed.data.messages);

  const requestedMax =
    parsed.data.max_completion_tokens ?? parsed.data.max_tokens ?? options.maxOutputTokens;
  const maxOutputTokens = Math.min(requestedMax, options.maxOutputTokens);
  const upstreamBody: Record<string, unknown> = {
    ...parsed.data,
    model: options.model,
    max_tokens: maxOutputTokens,
  };
  delete upstreamBody.max_completion_tokens;

  // UTF-8 bytes are a conservative upper bound for ordinary text tokenizer tokens.
  // The fixed allowance covers chat framing and provider-side tokenization overhead.
  const bodyBytes = Buffer.byteLength(JSON.stringify(upstreamBody), "utf8");
  const conservativeInputTokens = bodyBytes + 2_048;
  const reservationNanoUsd =
    conservativeInputTokens * options.inputNanoUsdPerToken +
    maxOutputTokens * options.outputNanoUsdPerToken;

  return {
    upstreamBody,
    stream: parsed.data.stream === true,
    reservationNanoUsd,
    maxOutputTokens,
    conservativeInputTokens,
  };
}
