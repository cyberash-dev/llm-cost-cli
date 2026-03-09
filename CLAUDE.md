# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

| Command | Purpose |
|---------|---------|
| `npm run build` | Bundle TypeScript → `dist/index.mjs` (via tsdown) |
| `npm run lint` | Lint with Biome |
| `npm run format` | Format with Biome |
| `npm run check` | Lint + format + organize imports (Biome) |
| `npm start` | Run the built CLI (`node dist/index.mjs`) |

No test framework is configured yet.

## Architecture

Clean Architecture (Hexagonal / Ports & Adapters). Dependencies point inward:

```
Presentation → Application → Domain ← Infrastructure
```

- **Domain** (`src/domain/`) — Pure types (`Provider`, entities, queries) and repository port interfaces. Zero external dependencies.
- **Application** (`src/application/`) — Use cases, helper functions, and application port interfaces (CredentialStore, Presenters). Depends only on Domain.
- **Infrastructure** (`src/infrastructure/`) — Adapters implementing all ports: Anthropic & OpenAI API clients (fetch), system keychain via cross-keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service), table/JSON presenters.
- **Presentation** (`src/presentation/commands/`) — CLI command registration via commander.js. Each command accepts `--provider` flag (default: `anthropic`).
- **Composition Root** (`src/index.ts`) — Creates all adapters per provider and registers commands. Credentials are loaded lazily (only when an API call is made).

## Specifications

The `spec/` folder contains architecture docs and per-entity/use-case specifications (in Russian). **Spec-first workflow**: update specs before changing code, get approval, then implement.

## Conventions

- **Factory functions** over classes: `createKeychainCredentialStore('anthropic')`, `createTablePresenter()`, etc.
- **Port files** suffixed with `.port.ts`
- **Use case files** suffixed with `.use-case.ts`
- **Command files** suffixed with `.command.ts`
- **ESM only** — `"type": "module"` with `.js` extensions in imports
- **Biome** for linting/formatting: 2-space indent, single quotes, organized imports
- **Target**: Node.js >= 18, ES2022, strict TypeScript
- **Cross-platform**: Keychain integration via cross-keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service)

## External API

### Anthropic Admin API (`api.anthropic.com`)
- `GET /v1/organizations/usage_report/messages` — token usage
- `GET /v1/organizations/cost_report` — cost data
- Auth: `x-api-key` header with `sk-ant-admin...` key
- Cursor-based pagination (`has_more` + `next_page`)

### OpenAI Admin API (`api.openai.com`)
- `GET /v1/organization/usage/completions` — token usage
- `GET /v1/organization/costs` — cost data
- Auth: `Authorization: Bearer sk-admin-...` header
- Cursor-based pagination (`has_more` + `next_page`)
- Dates as unix timestamps, amounts in dollars (not cents)

### OpenRouter API (`openrouter.ai`)
- `GET /api/v1/activity` — usage and cost data (single day per request)
- Auth: `Authorization: Bearer sk-or-...` header
- Only last 30 days available
