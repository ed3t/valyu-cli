import { writeFileSync } from "node:fs";
import type { ApiErrorShape } from "./types.js";

export interface OutputOptions {
  json: boolean;
  save?: string;
  quiet: boolean;
}

export function writeOutput(
  data: string | object,
  options: OutputOptions
): void {
  const str =
    options.json
      ? JSON.stringify(typeof data === "object" && data !== null ? data : { output: data }, null, 2)
      : typeof data === "string"
        ? data
        : JSON.stringify(data, null, 2);
  if (options.save) {
    writeFileSync(options.save, str, "utf-8");
    if (!options.quiet) {
      process.stderr.write(`Saved to ${options.save}\n`);
    }
  } else {
    process.stdout.write(str + "\n");
  }
}

export function formatApiError(res: ApiErrorShape): string {
  const msg = res.error ?? "Unknown error";
  return res.tx_id ? `Error: ${msg} (tx_id: ${res.tx_id})` : `Error: ${msg}`;
}

export function log(message: string, options: { quiet: boolean }): void {
  if (!options.quiet) {
    process.stderr.write(message + "\n");
  }
}

export function logCost(costDollars: number, options: { quiet: boolean }): void {
  if (!options.quiet && typeof costDollars === "number") {
    process.stderr.write(`Cost: $${costDollars.toFixed(4)}\n`);
  }
}