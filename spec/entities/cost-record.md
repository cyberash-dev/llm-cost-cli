# Entity: CostRecord

## Назначение

Запись о расходах за определённый период. Представляет собой одну строку в отчёте cost -- стоимость по конкретному описанию/модели за один день.

## Расположение

`src/domain/entities.ts`

## Определение

```typescript
type CostRecord = {
  date: string
  description: string | null
  model: string | null
  amountDollars: number
  currency: string
  tokenType: string | null
  costType: string | null
  serviceTier: string | null
}
```

## Поля

| Поле | Тип | Описание |
|------|-----|----------|
| `date` | `string` | ISO 8601 дата начала bucket (`starting_at` из API) |
| `description` | `string \| null` | Описание статьи расходов (при группировке по `description`) |
| `model` | `string \| null` | Идентификатор модели |
| `amountDollars` | `number` | Сумма в долларах (конвертируется из центов: `amount / 100`) |
| `currency` | `string` | Валюта (обычно `USD`) |
| `tokenType` | `string \| null` | Тип токена (input, output, и т.д.) |
| `costType` | `string \| null` | Тип стоимости |
| `serviceTier` | `string \| null` | Service tier |

## Маппинг из API

Создаётся из `RawCostBucket` + `RawCostResult` (ответ Anthropic API):

| CostRecord | API Response |
|------------|-------------|
| `date` | `bucket.starting_at` |
| `description` | `result.description` |
| `model` | `result.model` |
| `amountDollars` | `parseFloat(result.amount) / 100` |
| `currency` | `result.currency` (default: `USD`) |
| `tokenType` | `result.token_type` |
| `costType` | `result.cost_type` |
| `serviceTier` | `result.service_tier` |

**Важно**: API возвращает `amount` в центах как строку. Конвертация: `parseFloat(amount) / 100`. При ошибке парсинга -- `0`.

## Отображение

**Table** (колонки):
- Date -- `date` отформатированная как `YYYY-MM-DD`
- Description -- `description` (обрезается до 40 символов) или `-`
- Model -- `model` или `-`
- Amount (USD) -- `amountDollars` с точностью 4 знака
- Token Type -- `tokenType` или `-`
- Tier -- `serviceTier` или `-`

**JSON**: массив объектов as-is.

**Sum mode**: `reduce` по `amountDollars` → вывод `Total: $X.XX <currency>`.
