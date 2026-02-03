import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { resolveApiKey, apiKeyMissingMessage } from "../src/config.js";

describe("resolveApiKey", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns override when provided", () => {
    process.env.VALYU_API_KEY = "env-key";
    expect(resolveApiKey("override-key")).toBe("override-key");
  });

  it("returns VALYU_API_KEY from env when no override", () => {
    process.env.VALYU_API_KEY = "env-key";
    expect(resolveApiKey()).toBe("env-key");
  });

  it("returns null or config value when no override and no env", () => {
    delete process.env.VALYU_API_KEY;
    const result = resolveApiKey();
    expect(result === null || typeof result === "string").toBe(true);
  });

  it("trims whitespace", () => {
    expect(resolveApiKey("  key  ")).toBe("key");
    process.env.VALYU_API_KEY = "  env  ";
    expect(resolveApiKey()).toBe("env");
  });
});

describe("apiKeyMissingMessage", () => {
  it("returns a string mentioning VALYU_API_KEY and config", () => {
    const msg = apiKeyMissingMessage();
    expect(msg).toContain("VALYU_API_KEY");
    expect(msg).toContain("apiKey");
    expect(msg).toContain(".valyu/config");
  });
});