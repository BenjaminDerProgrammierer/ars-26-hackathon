import { describe, expect, it } from "vitest";
import {
  applyRequestPolicy,
  InvalidProxyRequestError,
} from "../src/request-policy.js";

const options = {
  model: "mistralai/mistral-medium-3-5",
  maxOutputTokens: 4096,
  inputNanoUsdPerToken: 1500,
  outputNanoUsdPerToken: 7500,
};

describe("request policy", () => {
  it("forces the allowed model and caps output", () => {
    const result = applyRequestPolicy(
      {
        model: "hackathon-model",
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 99999,
      },
      options,
    );
    expect(result.upstreamBody.model).toBe(options.model);
    expect(result.upstreamBody.max_tokens).toBe(4096);
    expect(result.reservationNanoUsd).toBeGreaterThan(0);
  });

  it("uses max_completion_tokens first and normalizes it for the upstream API", () => {
    const result = applyRequestPolicy(
      {
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 200,
        max_completion_tokens: 100,
        temperature: 0.5,
      },
      options,
    );

    expect(result.maxOutputTokens).toBe(100);
    expect(result.upstreamBody).toMatchObject({
      model: options.model,
      max_tokens: 100,
      temperature: 0.5,
    });
    expect(result.upstreamBody).not.toHaveProperty("max_completion_tokens");
  });

  it("uses configured defaults and reports streaming requests", () => {
    const result = applyRequestPolicy(
      { messages: [{ role: "user", content: "Hello" }], stream: true },
      options,
    );

    expect(result.maxOutputTokens).toBe(options.maxOutputTokens);
    expect(result.stream).toBe(true);
    expect(result.conservativeInputTokens).toBeGreaterThan(2_048);
    expect(result.reservationNanoUsd).toBe(
      result.conservativeInputTokens * options.inputNanoUsdPerToken +
        options.maxOutputTokens * options.outputNanoUsdPerToken,
    );
  });

  it.each([
    null,
    {},
    { messages: [] },
    { messages: [{ role: "user", content: "Hi" }], max_tokens: 0 },
    { messages: [{ role: "user", content: "Hi" }], stream: "yes" },
  ])("rejects malformed input: %j", (input) => {
    expect(() => applyRequestPolicy(input, options)).toThrow(
      "Invalid OpenAI chat completions request",
    );
  });

  it("detects image content nested inside message objects", () => {
    expect(() =>
      applyRequestPolicy(
        {
          messages: [
            {
              role: "user",
              content: {
                wrapper: [{ nested: { type: "input_image", data: "ignored" } }],
              },
            },
          ],
        },
        options,
      ),
    ).toThrow(/text requests only/);
  });

  it.each([
    "file",
    "input_audio",
    "video_url",
  ])("rejects %s message content so multimodal charges cannot bypass the reservation", (type) => {
    expect(() =>
      applyRequestPolicy(
        {
          messages: [
            {
              role: "user",
              content: [{ type, url: "https://example.test/media" }],
            },
          ],
        },
        options,
      ),
    ).toThrow(/text requests only/);
  });

  it.each([
    { plugins: [{ id: "web" }] },
    { models: [options.model, "another/model"] },
    { provider: { allow_fallbacks: true } },
    { route: "fallback" },
    { transforms: ["middle-out"] },
    { web_search_options: {} },
    { n: 2 },
    { modalities: ["text", "audio"] },
  ])("rejects unbudgeted routing or cost extensions: %j", (extension) => {
    expect(() =>
      applyRequestPolicy(
        {
          messages: [{ role: "user", content: "Hi" }],
          ...extension,
        },
        options,
      ),
    ).toThrow("Invalid OpenAI chat completions request");
  });

  it("rejects other models and images", () => {
    expect(() =>
      applyRequestPolicy(
        { model: "another/model", messages: [{ role: "user", content: "Hi" }] },
        options,
      ),
    ).toThrow(InvalidProxyRequestError);
    expect(() =>
      applyRequestPolicy(
        {
          messages: [
            {
              role: "user",
              content: [{ type: "image_url", image_url: { url: "https://x" } }],
            },
          ],
        },
        options,
      ),
    ).toThrow(/text requests only/);
  });
});
