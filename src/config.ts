import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const CONFIG_FILENAME = "config";
const CONFIG_DIRS = [
  join(process.cwd(), ".valyu"),
  join(homedir(), ".valyu"),
];

export interface CliConfig {
  apiKey: string;
}

const API_KEY_ENV = "VALYU_API_KEY";

/**
 * Resolve API key: --api-key > VALYU_API_KEY > config file.
 */
export function resolveApiKey(override?: string): string | null {
  if (override?.trim()) return override.trim();
  const env = process.env[API_KEY_ENV];
  if (env?.trim()) return env.trim();
  const fromFile = loadConfigFromFile();
  if (!fromFile) return null;
  const key =
    (fromFile as CliConfig).apiKey?.trim() ??
    (fromFile as Record<string, string>)[API_KEY_ENV]?.trim();
  return key ?? null;
}

function loadConfigFromFile(): Partial<CliConfig> & Record<string, string> | null {
  for (const dir of CONFIG_DIRS) {
    const filePath = join(dir, CONFIG_FILENAME);
    if (!existsSync(filePath)) continue;
    try {
      const raw = readFileSync(filePath, "utf-8");
      return parseConfigFile(raw);
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        process.stderr.write(`Invalid config at ${join(dir, CONFIG_FILENAME)}: ${String(err)}\n`);
      }
      return null;
    }
  }
  return null;
}

/** Accept simple key=value or JSON. */
function parseConfigFile(raw: string): Partial<CliConfig> & Record<string, string> {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) {
    return JSON.parse(trimmed) as Partial<CliConfig> & Record<string, string>;
  }
  const out: Record<string, string> = {};
  for (const line of trimmed.split("\n")) {
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (key) out[key] = value;
  }
  return out as Partial<CliConfig> & Record<string, string>;
}

export function apiKeyMissingMessage(): string {
  return [
    "Valyu API key is required.",
    "Set VALYU_API_KEY in your environment, or use --api-key <key>,",
    "or add apiKey or VALYU_API_KEY to ~/.valyu/config or .valyu/config.",
    "Get your key: https://platform.valyu.network",
  ].join(" ");
}