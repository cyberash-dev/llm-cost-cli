# Entity: UsageReportQuery

## Назначение

Параметры запроса к Usage Report API. Формируется из CLI-аргументов в use case `GetUsageReport`.

## Расположение

`src/domain/entities.ts`

## Определение

```typescript
type UsageReportQuery = {
  dateRange: DateRange
  models?: string[]
  apiKeyIds?: string[]
  groupBy?: string[]
  bucketWidth?: '1d' | '1h' | '1m'
}
```

## Поля

| Поле | Тип | Default | Описание |
|------|-----|---------|----------|
| `dateRange` | `DateRange` | last 7 days | Временной диапазон выборки |
| `models` | `string[]` | `undefined` (все) | Фильтр по моделям |
| `apiKeyIds` | `string[]` | `undefined` (все) | Фильтр по API key ID |
| `groupBy` | `string[]` | `['model']` | Группировка: `model`, `api_key_id`, `workspace_id`, `service_tier` |
| `bucketWidth` | `'1d' \| '1h' \| '1m'` | `'1d'` | Гранулярность: день, час, минута |

## Маппинг в API query parameters

| Query field | API parameter | Формат |
|-------------|---------------|--------|
| `dateRange.startingAt` | `starting_at` | ISO 8601 |
| `dateRange.endingAt` | `ending_at` | ISO 8601 |
| `bucketWidth` | `bucket_width` | `1d` / `1h` / `1m` |
| `models` | `models[]` | повторяющийся параметр |
| `apiKeyIds` | `api_key_ids[]` | повторяющийся параметр |
| `groupBy` | `group_by[]` | повторяющийся параметр |

## CLI-флаги → Query

| CLI flag | Query field |
|----------|-------------|
| `--from`, `--to`, `--period` | `dateRange` (через `parseDateRange`) |
| `--model` (comma-separated) | `models` |
| `--api-keys` (comma-separated) | `apiKeyIds` |
| `--group-by` (comma-separated) | `groupBy` |
| `--bucket` | `bucketWidth` |
