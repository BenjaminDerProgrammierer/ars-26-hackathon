import type { Response } from "express";
import { finalizeReservation, type Reservation } from "./budget.js";
import type { ProxyDatabase } from "./db.js";

const openRouterChatCompletionsUrl =
  "https://openrouter.ai/api/v1/chat/completions";

interface OpenRouterUsage {
  prompt_tokens?: unknown;
  completion_tokens?: unknown;
  cost?: unknown;
}

interface OpenRouterPayload {
  id?: unknown;
  usage?: OpenRouterUsage;
}

interface ForwardInput {
  db: ProxyDatabase;
  reservation: Reservation;
  response: Response;
  upstreamBody: Record<string, unknown>;
  apiKey: string;
  siteUrl: string;
  appName: string;
  timeoutMs: number;
  fetchImpl?: typeof fetch;
}

function nonnegativeSafeInteger(value: unknown): number | undefined {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? value
    : undefined;
}

function usageResult(
  payload: OpenRouterPayload | null,
  reservedNanoUsd: number,
) {
  const cost = payload?.usage?.cost;
  const nanoUsd = typeof cost === "number" ? Math.round(cost * 1e9) : NaN;
  const costIsValid =
    typeof cost === "number" &&
    Number.isFinite(cost) &&
    cost >= 0 &&
    Number.isSafeInteger(nanoUsd);
  const costFitsReservation = costIsValid && nanoUsd <= reservedNanoUsd;

  return {
    actualNanoUsd: costFitsReservation ? nanoUsd : null,
    promptTokens: nonnegativeSafeInteger(payload?.usage?.prompt_tokens),
    completionTokens: nonnegativeSafeInteger(payload?.usage?.completion_tokens),
    providerGenerationId:
      typeof payload?.id === "string" ? payload.id : undefined,
    usageErrorCode:
      cost === undefined
        ? "provider_usage_missing"
        : !costIsValid
          ? "provider_usage_invalid"
          : !costFitsReservation
            ? "provider_cost_exceeds_reservation"
            : undefined,
  };
}

function parsePayload(value: string): OpenRouterPayload | null {
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as OpenRouterPayload)
      : null;
  } catch {
    return null;
  }
}

function finalizeUpstreamFailure(
  input: ForwardInput,
  failure: { status: number; message: string; code: string },
): void {
  finalizeReservation(input.db, input.reservation, {
    actualNanoUsd: null,
    status: "estimated",
    errorCode: failure.code,
  });
  if (input.response.headersSent) {
    if (!input.response.writableEnded && !input.response.destroyed) {
      input.response.end();
    }
    return;
  }
  input.response.status(failure.status).json({
    error: {
      message: failure.message,
      type: "api_error",
      code: failure.code,
    },
  });
}

function finalizeConnectionError(input: ForwardInput): void {
  finalizeUpstreamFailure(input, {
    status: 502,
    message: "Could not reach the model provider",
    code: "upstream_connection_error",
  });
}

function finalizeTimeout(input: ForwardInput): void {
  finalizeUpstreamFailure(input, {
    status: 504,
    message: "The model provider did not respond before the request deadline",
    code: "upstream_timeout",
  });
}

async function forwardProviderError(
  input: ForwardInput,
  upstream: globalThis.Response,
) {
  const rawBody = await upstream.text();
  finalizeReservation(input.db, input.reservation, {
    actualNanoUsd: 0,
    status: "failed",
    errorCode: `provider_${upstream.status}`,
  });
  const contentType = upstream.headers.get("content-type");
  if (contentType) input.response.type(contentType);
  const retryAfter = upstream.headers.get("retry-after");
  if (retryAfter) input.response.setHeader("retry-after", retryAfter);
  input.response.status(upstream.status).send(rawBody);
}

async function forwardNonStreaming(
  input: ForwardInput,
  upstream: globalThis.Response,
) {
  const rawBody = await upstream.text();
  const payload = parsePayload(rawBody);
  if (!payload) {
    finalizeConnectionError(input);
    return;
  }

  const usage = usageResult(payload, input.reservation.reservedNanoUsd);
  const { usageErrorCode, ...usageFields } = usage;
  finalizeReservation(input.db, input.reservation, {
    ...usageFields,
    status: usage.actualNanoUsd === null ? "estimated" : "succeeded",
    errorCode: usageErrorCode,
  });
  input.response.status(upstream.status).json(payload);
}

function usageFromSseEvent(event: string): OpenRouterPayload | null {
  const data = event
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart())
    .join("\n");
  return data && data !== "[DONE]" ? parsePayload(data) : null;
}

async function forwardStreaming(
  input: ForwardInput,
  upstream: globalThis.Response,
  signal: AbortSignal,
) {
  if (!upstream.body) {
    finalizeConnectionError(input);
    return;
  }

  input.response.status(upstream.status);
  input.response.setHeader("content-type", "text/event-stream; charset=utf-8");
  input.response.setHeader("cache-control", "no-cache");
  input.response.setHeader("connection", "keep-alive");
  input.response.flushHeaders();

  let clientConnected = true;
  input.response.on("close", () => {
    clientConnected = false;
  });
  const decoder = new TextDecoder();
  let buffered = "";
  let finalPayload: OpenRouterPayload | null = null;
  let streamFailed = false;
  let timedOut = false;
  const reader = upstream.body.getReader();

  try {
    while (true) {
      const { done, value: chunk } = await reader.read();
      if (done) break;
      if (clientConnected) input.response.write(chunk);
      buffered += decoder.decode(chunk, { stream: true });

      let boundary = buffered.search(/\r?\n\r?\n/);
      while (boundary >= 0) {
        const event = buffered.slice(0, boundary);
        const separator =
          buffered.slice(boundary).match(/^\r?\n\r?\n/)?.[0] ?? "\n\n";
        buffered = buffered.slice(boundary + separator.length);
        const payload = usageFromSseEvent(event);
        if (payload?.usage) finalPayload = payload;
        boundary = buffered.search(/\r?\n\r?\n/);
      }
    }
    buffered += decoder.decode();
    const payload = usageFromSseEvent(buffered);
    if (payload?.usage) finalPayload = payload;
  } catch {
    streamFailed = true;
    timedOut = signal.aborted;
  } finally {
    const usage = usageResult(finalPayload, input.reservation.reservedNanoUsd);
    const { usageErrorCode, ...usageFields } = usage;
    finalizeReservation(input.db, input.reservation, {
      ...usageFields,
      status:
        !streamFailed && usage.actualNanoUsd !== null
          ? "succeeded"
          : "estimated",
      errorCode: timedOut
        ? "upstream_timeout"
        : streamFailed
          ? "stream_usage_missing"
          : usageErrorCode,
    });
    if (clientConnected) input.response.end();
  }
}

export async function forwardOpenRouterRequest(
  input: ForwardInput,
): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs);
  timeout.unref?.();

  try {
    const upstream = await (input.fetchImpl ?? fetch)(
      openRouterChatCompletionsUrl,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${input.apiKey}`,
          "content-type": "application/json",
          ...(input.siteUrl ? { "http-referer": input.siteUrl } : {}),
          ...(input.appName ? { "x-openrouter-title": input.appName } : {}),
        },
        body: JSON.stringify(input.upstreamBody),
        signal: controller.signal,
      },
    );

    if (!upstream.ok) {
      await forwardProviderError(input, upstream);
      return;
    }
    if (input.upstreamBody.stream === true) {
      await forwardStreaming(input, upstream, controller.signal);
      return;
    }
    await forwardNonStreaming(input, upstream);
  } catch {
    if (controller.signal.aborted) finalizeTimeout(input);
    else finalizeConnectionError(input);
  } finally {
    clearTimeout(timeout);
  }
}
