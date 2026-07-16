import { z } from "zod";

const requestSchema = z
  .object({
    model: z.string().optional(),
    messages: z.array(z.unknown()).min(1),
    stream: z.boolean().optional(),
    max_tokens: z.number().int().positive().optional(),
    max_completion_tokens: z.number().int().positive().optional(),
    temperature: z.number().optional(),
    top_p: z.number().optional(),
    stop: z.union([z.string(), z.array(z.string())]).optional(),
    frequency_penalty: z.number().optional(),
    presence_penalty: z.number().optional(),
    seed: z.number().int().optional(),
    response_format: z.record(z.string(), z.unknown()).optional(),
    logit_bias: z.record(z.string(), z.number()).optional(),
    logprobs: z.boolean().optional(),
    top_logprobs: z.number().int().nonnegative().optional(),
    tools: z.array(z.unknown()).optional(),
    tool_choice: z.unknown().optional(),
    parallel_tool_calls: z.boolean().optional(),
    user: z.string().optional(),
  })
  // Keep this allowlist explicit: OpenRouter extensions can select fallback
  // models or invoke separately billed services that the reservation cannot
  // conservatively price.
  .strict();

const multimodalContentTypes = new Set([
  "audio",
  "file",
  "image",
  "image_url",
  "input_audio",
  "input_file",
  "input_image",
  "input_video",
  "video",
  "video_url",
]);

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
  if (
    typeof record.type === "string" &&
    multimodalContentTypes.has(record.type)
  ) {
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
    throw new InvalidProxyRequestError(
      "Invalid OpenAI chat completions request",
    );
  }

  if (
    parsed.data.model &&
    parsed.data.model !== options.model &&
    parsed.data.model !== "hackathon-model"
  ) {
    throw new InvalidProxyRequestError(`Only ${options.model} is available`);
  }
  assertTextOnly(parsed.data.messages);

  const requestedMax =
    parsed.data.max_completion_tokens ??
    parsed.data.max_tokens ??
    options.maxOutputTokens;
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
