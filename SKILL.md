---
name: llm-cost-cli
description: Multi-provider CLI for LLM API usage and cost reports (Anthropic, OpenAI, OpenRouter). Cross-platform keychain storage. Table/JSON output.
metadata: {"clawdbot":{"emoji":"📊","os":["macos","linux","windows"],"requires":{"bins":["llm-cost","node"]},"install":[{"id":"npm","kind":"shell","command":"npm install -g llm-cost-cli","bins":["llm-cost"],"label":"Install llm-cost-cli via npm"}],"source":"https://github.com/cyberash-dev/llm-cost-cli"}}
---

# llm-cost-cli

A CLI for querying LLM API usage and cost data across multiple providers (Anthropic, OpenAI, OpenRouter). Credentials are stored in the system keychain via cross-keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service).

## Installation

Requires Node.js >= 18. The package is fully open source under the MIT license: https://github.com/cyberash-dev/llm-cost-cli

```bash
npm install -g llm-cost-cli
```

The npm package is published with provenance attestation, linking each release to its source commit via GitHub Actions. You can verify the published contents before installing:
```bash
npm pack llm-cost-cli --dry-run
```

Install from source (if you prefer to audit the code before running):
```bash
git clone https://github.com/cyberash-dev/llm-cost-cli.git
cd claude-cost-cli
npm install && npm run build && npm link
```

After installation the `llm-cost` command is available globally.

## Quick Start

```bash
llm-cost config set-key                        # Store Anthropic admin API key (default provider)
llm-cost config set-key --provider openai      # Store OpenAI admin API key
llm-cost config set-key --provider openrouter  # Store OpenRouter API key
llm-cost usage                                 # Token usage for the last 7 days
llm-cost cost                                  # Cost breakdown for the last 7 days
llm-cost cost --provider all --sum             # Total spend across all providers
```

## API Key Management

Store API key (interactive masked prompt):
```bash
llm-cost config set-key                        # Anthropic (sk-ant-admin...)
llm-cost config set-key --provider openai      # OpenAI (sk-admin-...)
llm-cost config set-key --provider openrouter  # OpenRouter (sk-or-...)
```

Show stored key (masked):
```bash
llm-cost config show
llm-cost config show --provider openai
```

Remove key from keychain:
```bash
llm-cost config remove-key
llm-cost config remove-key --provider openrouter
```

Keys can also be provided via environment variables: `LLM_COST_ANTHROPIC_API_KEY`, `LLM_COST_OPENAI_API_KEY`, `LLM_COST_OPENROUTER_API_KEY`.

## Usage Reports

```bash
llm-cost usage                                    # Last 7 days, daily, grouped by model
llm-cost usage --provider openai --period 30d     # OpenAI usage, last 30 days
llm-cost usage --provider all                     # All providers combined
llm-cost usage --from 2026-01-01 --to 2026-01-31 # Custom date range
llm-cost usage --model claude-sonnet-4            # Filter by model
llm-cost usage --api-keys apikey_01Rj,apikey_02Xz # Filter by API key IDs
llm-cost usage --group-by model,api_key_id        # Group by multiple dimensions
llm-cost usage --bucket 1h                        # Hourly granularity (1d, 1h, 1m)
```

JSON output (for scripting):
```bash
llm-cost usage --json
llm-cost usage --provider all --period 30d --json
```

Output columns: Date, Provider, Model, Input Tokens, Cached Tokens, Output Tokens, Web Searches.

## Cost Reports

```bash
llm-cost cost                                           # Last 7 days, grouped by description
llm-cost cost --provider openai --period 30d            # OpenAI costs, last 30 days
llm-cost cost --provider all --sum                      # Total across all providers
llm-cost cost --from 2026-01-01 --to 2026-01-31        # Custom date range
llm-cost cost --group-by workspace_id,description       # Group by workspace and description
llm-cost cost --sum                                     # Total cost only
```

JSON output (for scripting):
```bash
llm-cost cost --json
llm-cost cost --sum --json
```

Output columns: Date, Provider, Description, Model, Amount (USD), Token Type, Tier.

## Flag Reference

### `usage`
| Flag | Description | Default |
|------|-------------|---------|
| `--provider <name>` | Provider: anthropic, openai, openrouter, all | anthropic |
| `--from <date>` | Start date (YYYY-MM-DD or ISO) | 7 days ago |
| `--to <date>` | End date (YYYY-MM-DD or ISO) | now |
| `--period <days>` | Shorthand period (7d, 30d, 90d) | 7d |
| `--model <models>` | Filter by model(s), comma-separated | all |
| `--api-keys <ids>` | Filter by API key ID(s), comma-separated | all |
| `--group-by <fields>` | Group by model, api_key_id, workspace_id, service_tier | model |
| `--bucket <width>` | Bucket width: 1d, 1h, 1m | 1d |
| `--json` | Output as JSON | false |

### `cost`
| Flag | Description | Default |
|------|-------------|---------|
| `--provider <name>` | Provider: anthropic, openai, openrouter, all | anthropic |
| `--from <date>` | Start date (YYYY-MM-DD or ISO) | 7 days ago |
| `--to <date>` | End date (YYYY-MM-DD or ISO) | now |
| `--period <days>` | Shorthand period (7d, 30d, 90d) | 7d |
| `--group-by <fields>` | Group by workspace_id, description | description |
| `--sum` | Output total cost only | false |
| `--json` | Output as JSON | false |

## Security and Data Storage

The following properties are by design and can be verified in the source code:

- **API keys**: stored in the system keychain via [cross-keychain](https://github.com/nicolo-ribaudo/cross-keychain) (macOS Keychain, Windows Credential Manager, Linux Secret Service). By design, never written to disk in plaintext. See [`src/infrastructure/keychain-credential-store.ts`](https://github.com/cyberash-dev/llm-cost-cli/blob/main/src/infrastructure/keychain-credential-store.ts) for the implementation.
- **Env fallback**: keys can also be provided via `LLM_COST_ANTHROPIC_API_KEY`, `LLM_COST_OPENAI_API_KEY`, or `LLM_COST_OPENROUTER_API_KEY` environment variables.
- **No config files**: all settings are passed via CLI flags. Nothing is stored on disk besides the keychain entries.
- **Network**: API keys are only sent to their respective provider endpoints over HTTPS (`api.anthropic.com`, `api.openai.com`, `openrouter.ai`). No other outbound connections are made.
- **Scope**: admin API keys grant read-only access to organization usage and cost data. They cannot modify billing, create API keys, or access conversation content.
- **No caching**: query results are not cached or persisted to disk. The CLI writes output to stdout only.

## API Reference

This CLI wraps the following provider APIs:

**Anthropic Admin API** (`api.anthropic.com`):
- Usage: `GET /v1/organizations/usage_report/messages`
- Cost: `GET /v1/organizations/cost_report`
- Docs: https://platform.claude.com/docs/en/build-with-claude/usage-cost-api

**OpenAI Admin API** (`api.openai.com`):
- Usage: `GET /v1/organization/usage/completions`
- Cost: `GET /v1/organization/costs`
- Docs: https://platform.openai.com/docs/api-reference/usage

**OpenRouter API** (`openrouter.ai`):
- Activity: `GET /api/v1/activity` (usage and cost data, last 30 days)
- Docs: https://openrouter.ai/docs/api-reference/activity
