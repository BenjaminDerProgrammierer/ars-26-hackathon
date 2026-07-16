import { describe, expect, it } from "vitest";
import { applyRequestPolicy, InvalidProxyRequestError } from "../src/request-policy.js";

const options = {
  model: "mistralai/mistral-medium-3-5",
  maxOutputTokens: 4096,
  inputNanoUsdPerToken: 1500,
  outputNanoUsdPerToken: 7500,
};

describe("request policy", () => {
  it("forces the allowed model and caps output", () => {
    const result = applyRequestPolicy(
      { model: "hackathon-model", messages: [{ role: "user", content: "Hello" }], max_tokens: 99999 },
      options,
    );
    expect(result.upstreamBody.model).toBe(options.model);
    expect(result.upstreamBody.max_tokens).toBe(4096);
    expect(result.reservationNanoUsd).toBeGreaterThan(0);
  });

  it("rejects other models and images", () => {
    expect(() =>
      applyRequestPolicy({ model: "another/model", messages: [{ role: "user", content: "Hi" }] }, options),
    ).toThrow(InvalidProxyRequestError);
    expect(() =>
      applyRequestPolicy(
        { messages: [{ role: "user", content: [{ type: "image_url", image_url: { url: "https://x" } }] }] },
        options,
      ),
    ).toThrow(/text requests only/);
  });
});
