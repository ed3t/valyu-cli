import type { Valyu } from "valyu-js";
import { writeOutput, log, logCost, formatApiError } from "../output.js";
import type { GlobalOutputOptions } from "../types.js";

interface DeepResearchCreateRes {
  // Res shape from deepresearch.create
  success?: boolean;
  error?: string;
  deepresearch_id?: string;
}

interface DeepResearchStatusRes {
  // Res shape from deepresearch.status/wait
  success?: boolean;
  error?: string;
  status?: string;
  progress?: { current_step?: number; total_steps?: number };
  output?: string;
  pdf_url?: string;
  usage?: { total_cost?: number };
}

export interface DeepResearchCreateRunOptions extends GlobalOutputOptions {
  model?: string;
  format?: string;
  wait: boolean;
  pollInterval?: number;
}

export async function runDeepResearchCreate(
  client: Valyu,
  query: string,
  options: DeepResearchCreateRunOptions
): Promise<void> {
  const mode = (options.model ?? "fast").toLowerCase();
  const validMode = mode === "heavy" ? "heavy" : "fast";
  const outputFormats = options.format
    ? options.format.split(",").map((f) => f.trim().toLowerCase())
    : ["markdown"];
  const formats = outputFormats
    .filter((f) => f === "markdown" || f === "pdf")
    .slice(0, 2) as ("markdown" | "pdf")[];
  if (formats.length === 0) formats.push("markdown");

  const createRes = await client.deepresearch.create({
    query,
    mode: validMode,
    outputFormats: formats,
  });

  if (!createRes.success) {
    writeOutput(
      options.json ? createRes : formatApiError(createRes),
      { json: options.json, save: options.save, quiet: options.quiet }
    );
    process.exitCode = 1;
    return;
  }

  const taskId = (createRes as DeepResearchCreateRes).deepresearch_id;
  if (!taskId) {
    log("No task id in response.", { quiet: options.quiet });
    process.exitCode = 1;
    return;
  }

  if (!options.wait) {
    const out = options.json
      ? createRes
      : `Task created: ${taskId}\nRun with --wait to poll until complete, or use: valyu deep-research status ${taskId}`;
    writeOutput(out, { json: options.json, save: options.save, quiet: options.quiet });
    return;
  }

  const pollInterval = options.pollInterval ?? 5000;
  if (!options.quiet) {
    process.stderr.write(`Waiting for task ${taskId} (poll every ${pollInterval}ms)...\n`);
  }

  const status = await client.deepresearch.wait(taskId, {
    pollInterval,
    onProgress: (s) => {
      if (!options.quiet && s.progress) {
        process.stderr.write(
          `Step ${s.progress.current_step}/${s.progress.total_steps}\n`
        );
      }
    },
  });

  if (!status.success) {
    writeOutput(
      options.json ? status : formatApiError(status),
      { json: options.json, save: options.save, quiet: options.quiet }
    );
    process.exitCode = 1;
    return;
  }

  const result = status as DeepResearchStatusRes;
  const out = options.json
    ? status
    : [
        result.output ?? "",
        result.pdf_url ? `\nPDF: ${result.pdf_url}` : "",
      ].join("");
  writeOutput(out, { json: options.json, save: options.save, quiet: options.quiet });

  const cost = result.usage?.total_cost;
  if (typeof cost === "number") {
    logCost(cost, { quiet: options.quiet });
  }
}

export async function runDeepResearchStatus(
  client: Valyu,
  taskId: string,
  options: Pick<GlobalOutputOptions, "json" | "save" | "quiet">
): Promise<void> {
  const status = await client.deepresearch.status(taskId);
  const out = options.json ? status : formatStatusHuman(status);
  writeOutput(out, { json: options.json, save: options.save, quiet: options.quiet });
  if (!status.success) process.exitCode = 1;
}

function formatStatusHuman(s: unknown): string {
  const o = s as DeepResearchStatusRes;
  if (o.success === false) {
    return formatApiError(o);
  }
  const status = o.status ?? "unknown";
  const progress = o.progress;
  let line = `Status: ${status}`;
  if (progress?.total_steps != null) {
    line += ` (step ${progress.current_step ?? 0}/${progress.total_steps})`;
  }
  if (o.output && typeof o.output === "string") {
    line += `\nOutput length: ${o.output.length} chars`;
  }
  return line;
}