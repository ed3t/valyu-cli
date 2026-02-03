# ∇ Valyu CLI

[![npm](https://img.shields.io/npm/v/valyu-cli)](https://www.npmjs.com/package/valyu-cli)
[![License](https://img.shields.io/github/license/ed3t/valyu-cli)](https://github.com/ed3t/valyu-cli/blob/main/LICENSE)
[![Release](https://img.shields.io/github/v/release/ed3t/valyu-cli)](https://github.com/ed3t/valyu-cli/releases)

CLI for [Valyu's](https://valyu.ai) DeepSearch API.  
Search, extract contents, and run DeepResearch from the terminal. Built on the official [valyu-js](https://github.com/valyuAI/valyu-js) SDK.

---

## Installation

```bash
yarn global add valyu-cli
# or
npm install -g valyu-cli
```

Run without installing:

```bash
npx valyu-cli search "your query"
```

**Requirements:** Node.js 18+

---

## Quick Start

```bash
# Set your API key (or use --api-key)
export VALYU_API_KEY="your-api-key"

# Search
valyu search "machine learning transformers" --max 5

# Extract content from URLs
valyu contents https://example.com --summary

# Create a DeepResearch task and wait for the result
valyu deep-research create "AI safety research summary" --wait
```

Get your API key: [Valyu Platform](https://platform.valyu.network)

---

## Authentication

**Environment variable (recommended):**

```bash
export VALYU_API_KEY="your-api-key"
```

**Config file:** Create `~/.valyu/config` or `.valyu/config` in your project:

```
apiKey=your-api-key
```

Or use `VALYU_API_KEY=your-api-key` as the key name. The CLI reads `apiKey` or `VALYU_API_KEY` from the file.

**Override per run:**

```bash
valyu search "query" --api-key "your-api-key"
# or
valyu -k "your-api-key" search "query"
```

---

## Global Options

| Option | Description |
|--------|-------------|
| `-k, --api-key <key>` | Override API key |
| `--json` | Output raw JSON |
| `--save <path>` | Write response to file |
| `-v, --verbose` | Log request details to stderr |
| `-q, --quiet` | Only result and errors |

---

## Commands

### Search

Search the Valyu DeepSearch API.

```bash
valyu search "query" [options]
```

| Option | Description | Default |
|--------|-------------|---------|
| `-t, --type <type>` | `all` \| `web` \| `proprietary` \| `news` | `all` |
| `-n, --max <number>` | Max results (1–100) | `10` |
| `--sources <list>` | Comma-separated included sources (e.g. `valyu/valyu-arxiv`) | |
| `--exclude-sources <list>` | Comma-separated excluded sources | |
| `--relevance <0-1>` | Min relevance score | `0.5` |
| `--max-price <number>` | Max CPM price | |
| `--start-date <YYYY-MM-DD>` | Start date filter | |
| `--end-date <YYYY-MM-DD>` | End date filter | |
| `--length <short\|medium\|large\|max>` | Response length | |

**Examples:**

```bash
# Basic search
valyu search "transformer architecture improvements" --max 5

# Academic sources only
valyu search "neural networks" --type proprietary --sources valyu/valyu-arxiv

# Save raw JSON for scripting or fixtures
valyu search "query" --json --save response.json
```

---

### Contents

Extract content from URLs with optional AI summary.

```bash
valyu contents <url> [url ...] [options]
```

Maximum 10 URLs per request. URLs must start with `http://` or `https://`.

| Option | Description | Default |
|--------|-------------|---------|
| `--summary` | Request AI summary | |
| `--summary-prompt <string>` | Custom summary instruction | |
| `--effort <normal\|high\|auto>` | Extraction effort | `normal` |
| `--length <short\|medium\|large\|max>` | Content length per URL | `short` |
| `--max-price <number>` | Max cost in USD | |

**Examples:**

```bash
# Raw content
valyu contents https://example.com

# With AI summary
valyu contents https://example.com --summary --length medium

# Multiple URLs, save JSON
valyu contents https://a.com https://b.com --summary --save out.json
```

---

### DeepResearch

Create and manage DeepResearch tasks. Use `--wait` to poll until complete and print the report.

**Create a task (and optionally wait):**

```bash
valyu deep-research create "query" [options]
```

| Option | Description | Default |
|--------|-------------|---------|
| `-m, --model <fast\|heavy>` | Model: fast or heavy | `fast` |
| `--format <formats>` | Output formats: `markdown`, `pdf` (comma-separated) | `markdown` |
| `--wait` | Poll until complete and print result | |
| `--poll-interval <ms>` | Poll interval when using `--wait` | `5000` |

**Get task status:**

```bash
valyu deep-research status <task-id>
```

**Examples:**

```bash
# Create task only (get task ID for later)
valyu deep-research create "Summarize recent AI safety research"

# Create and wait for result (report printed to stdout)
valyu deep-research create "AI safety research summary" --wait

# Request markdown + PDF (API returns report text + PDF URL)
valyu deep-research create "Topic" --format markdown,pdf --wait

# Check status of a task
valyu deep-research status dr_abc123
```

**Output:** The report text is printed to stdout. If you requested PDF, the API may return a `pdf_url`; the CLI prints that URL (the PDF is hosted by Valyu; use the URL to download). To save the markdown report to a file: `valyu deep-research create "query" --wait > report.md` or use `--save report.json` for the full JSON response.

---

## Configuration

API key is resolved in this order:

1. `--api-key` (or `-k`)
2. `VALYU_API_KEY` environment variable
3. Config file: `.valyu/config` in the current directory, then `~/.valyu/config`

Config file format (key=value or JSON):

```
apiKey=your-api-key
```

or

```json
{"apiKey": "your-api-key"}
```

---

## Error Handling

Failed API calls set exit code 1. Use the response and `tx_id` for debugging.

```bash
# Check exit code in scripts
valyu search "query" || echo "Search failed"

# JSON output includes success, error, and tx_id
valyu search "query" --json
```

Validation errors (e.g. invalid `--max`, non-URL in `contents`) print a message to stderr and exit with code 1.

---

## Development

```bash
# Clone and install
git clone https://github.com/ed3t/valyu-cli.git
cd valyu-cli
yarn install

# Build
yarn build

# Run CLI from dist
node dist/cli.js search "query"

# Lint and test
yarn lint
yarn test
```

---

## License

MIT License
