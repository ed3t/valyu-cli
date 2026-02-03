import type { Valyu } from "valyu-js";
import type { ContentsResponse, ContentResult } from "valyu-js";
import { writeOutput, logCost, formatApiError } from "../output.js";
import type { GlobalOutputOptions } from "../types.js";

const PREVIEW_LEN = 300;

function formatContentResult(r: ContentResult): string {
  const lines: string[] = [];
  lines.push(`URL: ${r.url}`);
  lines.push(`Title: ${r.title || "(no title)"}`);
  const content = typeof r.content === "string" ? r.content : String(r.content ?? "");
  const preview = content.length > PREVIEW_LEN
    ? content.slice(0, PREVIEW_LEN) + "..."
    : content;
  if (preview) lines.push(preview.replace(/\n/g, " ").trim());
  if (r.summary != null) {
    const sum = typeof r.summary === "string" ? r.summary : JSON.stringify(r.summary);
    lines.push(`Summary: ${sum}`);
  }
  return lines.join("\n");
}

function formatContentsHuman(res: ContentsResponse): string {
  if (!res.success) {
    return formatApiError(res);
  }
  const parts = (res.results ?? []).map((r) => formatContentResult(r));
  return parts.join("\n\n---\n\n");
}

export interface ContentsRunOptions extends GlobalOutputOptions {
  summary?: boolean;
  summaryPrompt?: string;
  effort?: string;
  length?: string;
  maxPrice?: number;
}

function resolveSummaryOption(options: ContentsRunOptions): string | boolean {
  // Resolve summary option: custom prompt string, or true for auto, or false for none
  if (options.summaryPrompt) return options.summaryPrompt;
  return options.summary === true;
}

export async function runContents(
  client: Valyu,
  urls: string[],
  options: ContentsRunOptions
): Promise<ContentsResponse> {
  const summary = resolveSummaryOption(options);

  const response = await client.contents(urls, {
    summary,
    extractEffort: options.effort as "normal" | "high" | "auto" | undefined,
    responseLength: options.length as "short" | "medium" | "large" | "max" | undefined,
    maxPriceDollars: options.maxPrice,
  });

  const out = options.json ? response : formatContentsHuman(response);
  writeOutput(out, {
    json: options.json,
    save: options.save,
    quiet: options.quiet,
  });

  if (!response.success) {
    process.exitCode = 1;
  } else if (typeof response.total_cost_dollars === "number") {
    logCost(response.total_cost_dollars, { quiet: options.quiet });
  }

  return response;
}