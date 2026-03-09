# Entity: UsageRecord

## Назначение

Запись об использовании токенов за определённый период. Представляет собой одну строку в отчёте usage -- данные по конкретной модели/ключу за один bucket (день/час/минуту).

## Расположение

`src/domain/entities.ts`

## Определение

```typescript
type UsageRecord = {
  provider: Provider
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
| `provider` | `Provider` | Провайдер (`'anthropic'` или `'openai'`) |
| `date` | `string` | ISO 8601 дата начала bucket |
| `model` | `string \| null` | Идентификатор модели |
| `uncachedInputTokens` | `number` | Количество некэшированных входных токенов |
| `cachedInputTokens` | `number` | Количество прочитанных из кэша входных токенов |
| `cacheCreationTokens` | `number` | Количество токенов на создание кэша |
| `outputTokens` | `number` | Количество выходных токенов |
| `webSearchRequests` | `number` | Количество запросов web search |
| `apiKeyId` | `string \| null` | ID API-ключа |
| `workspaceId` | `string \| null` | ID workspace / project |
| `serviceTier` | `string \| null` | Service tier |

## Маппинг из Anthropic API

| UsageRecord | API Response |
|-------------|-------------|
| `provider` | `'anthropic'` (hardcoded) |
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

## Маппинг из OpenAI API

| UsageRecord | API Response |
|-------------|-------------|
| `provider` | `'openai'` (hardcoded) |
| `date` | `new Date(bucket.start_time * 1000).toISOString()` |
| `model` | `result.model` |
| `uncachedInputTokens` | `result.input_tokens - result.input_cached_tokens` |
| `cachedInputTokens` | `result.input_cached_tokens` |
| `cacheCreationTokens` | `0` (не поддерживается) |
| `outputTokens` | `result.output_tokens` |
| `webSearchRequests` | `0` (не поддерживается) |
| `apiKeyId` | `null` |
| `workspaceId` | `result.project_id` |
| `serviceTier` | `null` |

## Отображение

**Table** (колонки):
- Date -- `date` отформатированная как `YYYY-MM-DD`
- Model -- `model` или `-`
- Input Tokens -- `uncachedInputTokens + cacheCreationTokens`
- Cached Tokens -- `cachedInputTokens`
- Output Tokens -- `outputTokens`
- Web Searches -- `webSearchRequests`

**JSON**: массив объектов as-is.
