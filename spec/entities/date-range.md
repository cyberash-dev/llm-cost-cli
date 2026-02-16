# Entity: DateRange

## Назначение

Временной диапазон для запросов к API. Используется во всех report-запросах для определения периода выборки данных.

## Расположение

`src/domain/entities.ts`

## Определение

```typescript
type DateRange = {
  startingAt: string
  endingAt: string
}
```

## Поля

| Поле | Тип | Описание |
|------|-----|----------|
| `startingAt` | `string` | Начало периода, ISO 8601 datetime string |
| `endingAt` | `string` | Конец периода, ISO 8601 datetime string |

## Правила формирования

`DateRange` создаётся через helper-функцию `parseDateRange(period?, from?, to?)`:

| Входные параметры | Результат |
|--------------------|-----------|
| `from` + `to` указаны | `startingAt = new Date(from)`, `endingAt = new Date(to)` |
| `period` указан (например `30d`) | `endingAt = now`, `startingAt = now - N days` |
| Ничего не указано | `endingAt = now`, `startingAt = now - 7 days` |

Формат `period`: `<число>d` (например `7d`, `30d`, `90d`). При невалидном значении используется 7 дней.

## Использование

- `UsageReportQuery.dateRange`
- `CostReportQuery.dateRange`
- Передаётся в API как query parameters `starting_at` и `ending_at`
