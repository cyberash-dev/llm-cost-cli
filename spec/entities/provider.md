# Entity: Provider

## Назначение

Идентификатор LLM-провайдера. Определяет, к какому API обращаться и какое хранилище ключей использовать.

## Расположение

`src/domain/entities.ts`

## Определение

```typescript
type Provider = 'anthropic' | 'openai' | 'openrouter'
type ProviderOption = Provider | 'all'
```

- `Provider` — конкретный провайдер, используется в сущностях, credentials, репозиториях.
- `ProviderOption` — значение CLI-флага `--provider`, включает `all` для запроса ко всем провайдерам.

## Значения

| Значение | API | Prefix ключа | Keychain account |
|----------|-----|-------------|-----------------|
| `anthropic` | `api.anthropic.com` | `sk-ant-admin` | `llm-cost-cli:anthropic` |
| `openai` | `api.openai.com` | `sk-admin-`, `sk-proj-`, `sk-svcacct-` | `llm-cost-cli:openai` |
| `openrouter` | `openrouter.ai/api/v1` | `sk-or-` (Management API key) | `llm-cost-cli:openrouter` |

### OpenRouter API

- Единый эндпоинт `GET /api/v1/activity` для cost и usage данных
- Параметр `date` (YYYY-MM-DD) — фильтр по одному дню; для диапазона итерируем по дням
- Доступны только последние 30 дней
- Авторизация: `Authorization: Bearer <key>`

## Env переменные (fallback)

Если ключ не найден в системном keychain, CLI проверяет env переменную:

| Provider | Env переменная |
|----------|---------------|
| `anthropic` | `LLM_COST_ANTHROPIC_API_KEY` |
| `openai` | `LLM_COST_OPENAI_API_KEY` |
| `openrouter` | `LLM_COST_OPENROUTER_API_KEY` |

Приоритет: системный keychain → env переменная. `set-key` всегда пишет в системный keychain.

## CLI-флаг

```
--provider <provider>    Provider: anthropic, openai, openrouter, or all (default: anthropic)
```

По умолчанию `anthropic` — обратная совместимость.

Когда `--provider all`, CLI запрашивает данные у каждого конкретного провайдера, объединяет результаты и выводит как единый набор.
