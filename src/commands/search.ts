import type { Valyu } from "valyu-js";
import type { SearchResponse, SearchResult } from "valyu-js";
import { writeOutput, log, logCost, formatApiError } from "../output.js";
import type { GlobalOutputOptions } from "../types.js";

const PREVIEW_LEN = 200;

function formatSearchResult(r: SearchResult, index: number): string {
  const lines: string[] = [];
  lines.push(`${index + 1}. ${r.title || "(no title)"}`);
  lines.push(`   URL: ${r.url}`);
  lines.push(`   Source: ${r.source}`);
  if (typeof r.relevance_score === "number") {
    lines.push(`   Relevance: ${r.relevance_score.toFixed(2)}`);
  }
  const content = typeof r.content === "string" ? r.content : "";
  const preview = content.length > PREVIEW_LEN
    ? content.slice(0, PREVIEW_LEN) + "..."
    : content;
  if (preview) lines.push(`   ${preview.replace(/\n/g, " ")}`);
  return lines.join("\n");
}

function formatSearchHuman(res: SearchResponse): string {
  if (!res.success) {
    return formatApiError(res);
  }
  const parts: string[] = [];
  if (res.results.length === 0) {
    parts.push("No results.");
  } else {
    parts.push(res.results.map((r, i) => formatSearchResult(r, i)).join("\n\n"));
  }
  return parts.join("\n");
}

export interface SearchRunOptions extends GlobalOutputOptions {
  type?: string;
  max?: number;
  sources?: string;
  excludeSources?: string;
  relevance?: number;
  maxPrice?: number;
  startDate?: string;
  endDate?: string;
  length?: string;
}

export async function runSearch(
  client: Valyu,
  query: string,
  options: SearchRunOptions
): Promise<SearchResponse> {
  const includedSources = options.sources
    ? options.sources.split(",").map((s) => s.trim()).filter(Boolean)
    : undefined;
  const excludeSources = options.excludeSources
    ? options.excludeSources.split(",").map((s) => s.trim()).filter(Boolean)
    : undefined;

  const searchType = (options.type ?? "all").toLowerCase();
  const validTypes = ["all", "web", "proprietary", "news"];
  const searchTypeOption = validTypes.includes(searchType)
    ? (searchType as "all" | "web" | "proprietary" | "news")
    : undefined;

  if (options.verbose) {
    log(
      `Request: search type=${options.type ?? "all"}, max=${options.max ?? 10}`,
      { quiet: options.quiet }
    );
  }

  const response = await client.search(query, {
    searchType: searchTypeOption,
    maxNumResults: options.max,
    includedSources: includedSources?.length ? includedSources : undefined,
    excludeSources: excludeSources?.length ? excludeSources : undefined,
    relevanceThreshold: options.relevance,
    maxPrice: options.maxPrice,
    startDate: options.startDate,
    endDate: options.endDate,
    responseLength: options.length as "short" | "medium" | "large" | "max" | undefined,
  });

  const out = options.json ? response : formatSearchHuman(response);
  writeOutput(out, {
    json: options.json,
    save: options.save,
    quiet: options.quiet,
  });

  if (!response.success) {
    process.exitCode = 1;
  } else if (typeof response.total_deduction_dollars === "number") {
    logCost(response.total_deduction_dollars, { quiet: options.quiet });
  }

  return response;
}