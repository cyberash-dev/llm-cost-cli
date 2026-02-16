# Entity: CostReportQuery

## Назначение

Параметры запроса к Cost Report API. Формируется из CLI-аргументов в use case `GetCostReport`.

## Расположение

`src/domain/entities.ts`

## Определение

```typescript
type CostReportQuery = {
  dateRange: DateRange
  groupBy?: ('workspace_id' | 'description')[]
}
```

## Поля

| Поле | Тип | Default | Описание |
|------|-----|---------|----------|
| `dateRange` | `DateRange` | last 7 days | Временной диапазон выборки |
| `groupBy` | `('workspace_id' \| 'description')[]` | `['description']` | Группировка результатов |

## Маппинг в API query parameters

| Query field | API parameter | Формат |
|-------------|---------------|--------|
| `dateRange.startingAt` | `starting_at` | ISO 8601 |
| `dateRange.endingAt` | `ending_at` | ISO 8601 |
| (hardcoded) | `bucket_width` | всегда `1d` |
| `groupBy` | `group_by[]` | повторяющийся параметр |

## CLI-флаги → Query

| CLI flag | Query field |
|----------|-------------|
| `--from`, `--to`, `--period` | `dateRange` (через `parseDateRange`) |
| `--group-by` (comma-separated) | `groupBy` |

## Отличия от UsageReportQuery

- Нет фильтрации по моделям и API-ключам
- `groupBy` ограничен значениями `workspace_id` и `description`
- `bucketWidth` всегда `1d` (зашито в repository)
