![llm-cost-cli banner](./assets/banner.png)

# llm-cost-cli

Multi-provider CLI for LLM API usage and cost reports. Supports Anthropic, OpenAI, and OpenRouter.

## Requirements

- Node.js 18+

## Install

```bash
npm install -g llm-cost-cli
```

Or run without installing:

```bash
npx llm-cost-cli
```

## Commands

### config set-key

Store your API key in the system keychain. Requires a provider admin API key.

```bash
llm-cost config set-key                        # Default: anthropic
llm-cost config set-key --provider openai
llm-cost config set-key --provider openrouter
```

### config show

Display masked API key.

```bash
llm-cost config show
llm-cost config show --provider openai
```

### config remove-key

Remove API key from keychain.

```bash
llm-cost config remove-key
llm-cost config remove-key --provider openrouter
```

### usage

Retrieve usage report with token counts.

```bash
llm-cost usage
llm-cost usage --provider openai --period 30d
llm-cost usage --provider all --from 2026-01-01 --to 2026-01-31 --json
llm-cost usage --model claude-opus-4 --group-by model,api_key_id
```

Options: `--provider` (anthropic/openai/openrouter/all), `--from`, `--to`, `--period` (7d/30d/90d), `--model`, `--api-keys`, `--group-by`, `--bucket` (1d/1h/1m), `--json`

### cost

Retrieve cost report in USD.

```bash
llm-cost cost
llm-cost cost --provider openai --period 30d
llm-cost cost --provider all --sum
llm-cost cost --json
```

Options: `--provider` (anthropic/openai/openrouter/all), `--from`, `--to`, `--period`, `--group-by`, `--sum` (output total only), `--json`

## Security and Data Storage

The following properties are by design and can be verified in the source code:

- **API keys**: stored in the system keychain via [cross-keychain](https://github.com/nicolo-ribaudo/cross-keychain) (macOS Keychain, Windows Credential Manager, Linux Secret Service). Never written to disk in plaintext. See [`src/infrastructure/keychain-credential-store.ts`](https://github.com/cyberash-dev/llm-cost-cli/blob/main/src/infrastructure/keychain-credential-store.ts).
- **Env fallback**: keys can also be provided via `LLM_COST_ANTHROPIC_API_KEY`, `LLM_COST_OPENAI_API_KEY`, or `LLM_COST_OPENROUTER_API_KEY` environment variables.
- **No config files**: all settings are passed via CLI flags. Nothing is stored on disk besides the keychain entries.
- **Network**: API keys are only sent to their respective provider endpoints over HTTPS (`api.anthropic.com`, `api.openai.com`, `openrouter.ai`). No other outbound connections are made.
- **Scope**: admin API keys grant read-only access to organization usage and cost data.
- **No caching**: query results are not cached or persisted to disk. The CLI writes output to stdout only.
