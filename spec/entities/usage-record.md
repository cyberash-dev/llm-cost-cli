# Entity: UsageRecord

## Назначение

Запись об использовании токенов за определённый период. Представляет собой одну строку в отчёте usage -- данные по конкретной модели/ключу за один bucket (день/час/минуту).

## Расположение

`src/domain/entities.ts`

## Определение

```typescript
type UsageRecord = {
  date: string
  model: string | null
  uncachedInputTokens: number
  cachedInputTokens: number
  cacheCreationTokens: number
  outputTokens: number
  webSearchRequests: number
  apiKeyId: string | null
  workspaceId: string | null
  serviceTier: string | null
}
```

## Поля

| Поле | Тип | Описание |
|------|-----|----------|
| `date` | `string` | ISO 8601 дата начала bucket (`starting_at` из API) |
| `model` | `string \| null` | Идентификатор модели (например `claude-sonnet-4`) |
| `uncachedInputTokens` | `number` | Количество некэшированных входных токенов |
| `cachedInputTokens` | `number` | Количество прочитанных из кэша входных токенов |
| `cacheCreationTokens` | `number` | Количество токенов, потраченных на создание кэша (сумма `ephemeral_1h` + `ephemeral_5m`) |
| `outputTokens` | `number` | Количество выходных токенов |
| `webSearchRequests` | `number` | Количество запросов web search (server tool use) |
| `apiKeyId` | `string \| null` | ID API-ключа (при группировке по `api_key_id`) |
| `workspaceId` | `string \| null` | ID workspace (при группировке по `workspace_id`) |
| `serviceTier` | `string \| null` | Service tier (при группировке по `service_tier`) |

## Маппинг из API

Создаётся из `RawUsageBucket` + `RawUsageResult` (ответ Anthropic API):

| UsageRecord | API Response |
|-------------|-------------|
| `date` | `bucket.starting_at` |
| `model` | `result.model` |
| `uncachedInputTokens` | `result.uncached_input_tokens` |
| `cachedInputTokens` | `result.cache_read_input_tokens` |
| `cacheCreationTokens` | `result.cache_creation.ephemeral_1h_input_tokens + ephemeral_5m_input_tokens` |
| `outputTokens` | `result.output_tokens` |
| `webSearchRequests` | `result.server_tool_use.web_search_requests` (default: 0) |
| `apiKeyId` | `result.api_key_id` |
| `workspaceId` | `result.workspace_id` |
| `serviceTier` | `result.service_tier` |

## Отображение

**Table** (колонки):
- Date -- `date` отформатированная как `YYYY-MM-DD`
- Model -- `model` или `-`
- Input Tokens -- `uncachedInputTokens + cacheCreationTokens`
- Cached Tokens -- `cachedInputTokens`
- Output Tokens -- `outputTokens`
- Web Searches -- `webSearchRequests`

**JSON**: массив объектов as-is.
