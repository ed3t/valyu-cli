import { describe, it, expect } from "vitest";
import { formatApiError } from "../src/output.js";

describe("formatApiError", () => {
  it("returns error message when no tx_id", () => {
    expect(formatApiError({ success: false, error: "Rate limited" })).toBe(
      "Error: Rate limited"
    );
  });

  it("includes tx_id when present", () => {
    expect(
      formatApiError({ success: false, error: "Not found", tx_id: "tx_123" })
    ).toBe("Error: Not found (tx_id: tx_123)");
  });

  it("handles null/undefined error", () => {
    expect(formatApiError({ success: false })).toBe("Error: Unknown error");
    expect(formatApiError({ success: false, tx_id: "tx_1" })).toBe(
      "Error: Unknown error (tx_id: tx_1)"
    );
  });
});