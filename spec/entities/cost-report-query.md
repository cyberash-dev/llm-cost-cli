# Entity: CostReportQuery

## Назначение

Параметры запроса к Cost Report API. Формируется из CLI-аргументов в use case `GetCostReport`.

## Расположение

`src/domain/entities.ts`

## Определение

```typescript
type CostReportQuery = {
  dateRange: DateRange
  groupBy?: string[]
}
```

## Поля

| Поле | Тип | Default | Описание |
|------|-----|---------|----------|
| `dateRange` | `DateRange` | last 7 days | Временной диапазон выборки |
| `groupBy` | `string[]` | `['description']` | Группировка результатов |

## Маппинг в API query parameters

### Anthropic

| Query field | API parameter | Формат |
|-------------|---------------|--------|
| `dateRange.startingAt` | `starting_at` | ISO 8601 |
| `dateRange.endingAt` | `ending_at` | ISO 8601 |
| (hardcoded) | `bucket_width` | всегда `1d` |
| `groupBy` | `group_by[]` | повторяющийся параметр |

### OpenAI

| Query field | API parameter | Формат |
|-------------|---------------|--------|
| `dateRange.startingAt` | `start_time` | unix seconds |
| `dateRange.endingAt` | `end_time` | unix seconds |
| (hardcoded) | `bucket_width` | всегда `1d` |
| `groupBy` | игнорируется | — |

## CLI-флаги → Query

| CLI flag | Query field |
|----------|-------------|
| `--from`, `--to`, `--period` | `dateRange` (через `parseDateRange`) |
| `--group-by` (comma-separated) | `groupBy` |

## Отличия от UsageReportQuery

- Нет фильтрации по моделям и API-ключам
- `groupBy` принимает `string[]` — адаптеры игнорируют неподдерживаемые значения
- `bucketWidth` всегда `1d` (зашито в repository)
