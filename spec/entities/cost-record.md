# Entity: CostRecord

## Назначение

Запись о расходах за определённый период. Представляет собой одну строку в отчёте cost -- стоимость по конкретному описанию/модели за один день.

## Расположение

`src/domain/entities.ts`

## Определение

```typescript
type CostRecord = {
  provider: Provider
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
| `provider` | `Provider` | Провайдер (`'anthropic'` или `'openai'`) |
| `date` | `string` | ISO 8601 дата начала bucket |
| `description` | `string \| null` | Описание статьи расходов |
| `model` | `string \| null` | Идентификатор модели |
| `amountDollars` | `number` | Сумма в долларах |
| `currency` | `string` | Валюта (обычно `USD`) |
| `tokenType` | `string \| null` | Тип токена |
| `costType` | `string \| null` | Тип стоимости |
| `serviceTier` | `string \| null` | Service tier |

## Маппинг из Anthropic API

| CostRecord | API Response |
|------------|-------------|
| `provider` | `'anthropic'` (hardcoded) |
| `date` | `bucket.starting_at` |
| `description` | `result.description` |
| `model` | `result.model` |
| `amountDollars` | `parseFloat(result.amount) / 100` (из центов в доллары) |
| `currency` | `result.currency` (default: `USD`) |
| `tokenType` | `result.token_type` |
| `costType` | `result.cost_type` |
| `serviceTier` | `result.service_tier` |

## Маппинг из OpenAI API

| CostRecord | API Response |
|------------|-------------|
| `provider` | `'openai'` (hardcoded) |
| `date` | `new Date(bucket.start_time * 1000).toISOString()` |
| `description` | `result.line_item` |
| `model` | `null` |
| `amountDollars` | `result.amount.value` (уже в долларах) |
| `currency` | `result.amount.currency` (default: `USD`) |
| `tokenType` | `null` |
| `costType` | `null` |
| `serviceTier` | `null` |

**Важно**: Anthropic возвращает `amount` в центах как строку. OpenAI возвращает `amount.value` в долларах как число.

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
