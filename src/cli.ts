#!/usr/bin/env node

import { createRequire } from "node:module";
import { Command } from "commander";
import { Valyu } from "valyu-js";
import { resolveApiKey, apiKeyMissingMessage } from "./config.js";
import { exitWithError } from "./exit.js";
import type { GlobalOutputOptions } from "./types.js";
import {
  runSearch,
  runContents,
  runDeepResearchCreate,
  runDeepResearchStatus,
} from "./commands/index.js";

const require = createRequire(import.meta.url);
const pkg = require("../package.json") as { version?: string };
const version = pkg.version ?? "0.0.0";

const program = new Command();

program
  .name("valyu")
  .description("CLI for Valyu DeepSearch API — search, contents, and deep-research from the terminal")
  .version(version)
  .option("-k, --api-key <key>", "Valyu API key (overrides VALYU_API_KEY and config)")
  .option("--json", "Output raw JSON")
  .option("--save <path>", "Write response JSON to file")
  .option("-v, --verbose", "Log request details to stderr")
  .option("-q, --quiet", "Only result and errors, no progress or hints");

function getGlobalOpts(): GlobalOutputOptions {
  const opts = program.opts();
  return {
    apiKey: opts.apiKey as string | undefined,
    json: Boolean(opts.json),
    save: opts.save as string | undefined,
    quiet: Boolean(opts.quiet),
    verbose: Boolean(opts.verbose),
  };
}

function createClient(apiKeyOverride?: string): Valyu {
  const key = resolveApiKey(apiKeyOverride);
  if (!key) {
    exitWithError(apiKeyMissingMessage());
  }
  return new Valyu(key);
}

function parseNum(value: unknown): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function parseMaxResults(value: unknown): number | undefined {
  const n = parseNum(value);
  if (n == null) return undefined;
  if (n < 1 || n > 100) return undefined;
  return n;
}

function parseRelevance(value: unknown): number | undefined {
  const n = parseNum(value);
  if (n == null) return undefined;
  if (n < 0 || n > 1) return undefined;
  return n;
}

// ---- search ----
program
  .command("search <query>")
  .description("Search the Valyu DeepSearch API")
  .option("-t, --type <type>", "Search type: all | web | proprietary | news", "all")
  .option("-n, --max <number>", "Max results (1-100)", "10")
  .option("--sources <list>", "Comma-separated included sources (e.g. valyu/valyu-arxiv)")
  .option("--exclude-sources <list>", "Comma-separated excluded sources")
  .option("--relevance <0-1>", "Min relevance score (0-1)", "0.5")
  .option("--max-price <number>", "Max CPM price")
  .option("--start-date <YYYY-MM-DD>", "Start date filter")
  .option("--end-date <YYYY-MM-DD>", "End date filter")
  .option("--length <short|medium|large|max>", "Response length")
  .action(async (query: string, cmdOpts: Record<string, unknown>) => {
    const global = getGlobalOpts();
    const max = parseMaxResults(cmdOpts.max ?? 10);
    if (cmdOpts.max != null && max === undefined) {
      exitWithError("--max must be a number between 1 and 100.");
    }
    const relevance = parseRelevance(cmdOpts.relevance ?? 0.5);
    if (cmdOpts.relevance != null && relevance === undefined) {
      exitWithError("--relevance must be a number between 0 and 1.");
    }
    const maxPrice = parseNum(cmdOpts.maxPrice);
    if (cmdOpts.maxPrice != null && maxPrice === undefined) {
      exitWithError("--max-price must be a number.");
    }
    const client = createClient(global.apiKey);
    await runSearch(client, query, {
      type: String(cmdOpts.type ?? "all"),
      max,
      sources: cmdOpts.sources as string | undefined,
      excludeSources: cmdOpts.excludeSources as string | undefined,
      relevance: relevance ?? 0.5,
      maxPrice,
      startDate: cmdOpts.startDate as string | undefined,
      endDate: cmdOpts.endDate as string | undefined,
      length: cmdOpts.length as string | undefined,
      ...global,
    });
  });

function isUrl(s: string): boolean {
  return s.startsWith("http://") || s.startsWith("https://");
}

// ---- contents ----
program
  .command("contents <urls...>")
  .description("Extract content from URLs (max 10)")
  .option("--summary", "Request AI summary")
  .option("--summary-prompt <string>", "Custom summary instruction")
  .option("--effort <normal|high|auto>", "Extraction effort", "normal")
  .option("--length <short|medium|large|max>", "Content length", "short")
  .option("--max-price <number>", "Max cost in USD")
  .action(async (urls: string[], cmdOpts: Record<string, unknown>) => {
    const global = getGlobalOpts();
    if (urls.length === 0) {
      exitWithError("At least one URL is required.");
    }
    if (urls.length > 10) {
      exitWithError("Maximum 10 URLs per request.");
    }
    const invalid = urls.filter((u) => !isUrl(u));
    if (invalid.length > 0) {
      exitWithError(`Invalid URL(s); use http:// or https://: ${invalid.join(", ")}`);
    }
    const maxPrice = parseNum(cmdOpts.maxPrice);
    if (cmdOpts.maxPrice != null && maxPrice === undefined) {
      exitWithError("--max-price must be a number.");
    }
    const client = createClient(global.apiKey);
    await runContents(client, urls, {
      summary: Boolean(cmdOpts.summary),
      summaryPrompt: cmdOpts.summaryPrompt as string | undefined,
      effort: (cmdOpts.effort as string) ?? "normal",
      length: (cmdOpts.length as string) ?? "short",
      maxPrice,
      ...global,
    });
  });

// ---- deep-research ----
const deepResearch = program
  .command("deep-research")
  .description("DeepResearch: create and wait for research tasks");

deepResearch
  .command("create <query>")
  .description("Create a DeepResearch task (optionally wait for result)")
  .option("-m, --model <fast|heavy>", "Model: fast or heavy", "fast")
  .option("--format <formats>", "Output formats: markdown, pdf (comma-separated)", "markdown")
  .option("--wait", "Poll until complete and print result")
  .option("--poll-interval <ms>", "Poll interval when using --wait", "5000")
  .action(async (query: string, cmdOpts: Record<string, unknown>) => {
    const global = getGlobalOpts();
    const pollInterval = parseNum(cmdOpts.pollInterval);
    if (cmdOpts.pollInterval != null && (pollInterval === undefined || pollInterval < 0)) {
      exitWithError("--poll-interval must be a non-negative number.");
    }
    const client = createClient(global.apiKey);
    await runDeepResearchCreate(client, query, {
      model: (cmdOpts.model as string) ?? "fast",
      format: (cmdOpts.format as string) ?? "markdown",
      wait: Boolean(cmdOpts.wait),
      pollInterval: pollInterval ?? 5000,
      ...global,
    });
  });

deepResearch
  .command("status <task-id>")
  .description("Get DeepResearch task status")
  .action(async (taskId: string) => {
    const global = getGlobalOpts();
    const client = createClient(global.apiKey);
    await runDeepResearchStatus(client, taskId, global);
  });

program.parse();