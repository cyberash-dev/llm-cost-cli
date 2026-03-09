# Use Case: GetCostReport

## Назначение

Получить отчёт о расходах за указанный период и вывести результат пользователю в виде таблицы, JSON, или суммы.

## CLI-команда

```bash
llm-cost cost [options]
```

## Расположение

- Use case: `src/application/use-cases/get-cost-report.use-case.ts`
- Command: `src/presentation/commands/cost.command.ts`

## Входные параметры

| Параметр | Тип | CLI-флаг | Default | Описание |
|----------|-----|----------|---------|----------|
| `provider` | `ProviderOption` | `--provider` | `anthropic` | Провайдер (`anthropic`, `openai`, `openrouter`, `all`) |
| `period` | `string?` | `--period` | `7d` | Период (например `7d`, `30d`, `90d`) |
| `from` | `string?` | `--from` | - | Дата начала (YYYY-MM-DD или ISO) |
| `to` | `string?` | `--to` | - | Дата конца (YYYY-MM-DD или ISO) |
| `groupBy` | `string[]?` | `--group-by` | `['description']` | Группировка (comma-separated) |
| `sumOnly` | `boolean` | `--sum` | `false` | Вывести только итоговую сумму |
| (output format) | `boolean` | `--json` | `false` | Формат вывода |

## Зависимости (порты)

| Порт | Описание |
|------|----------|
| `CostRepository` | Получение данных из Cost API (выбирается по provider) |
| `CostPresenter` | Форматирование и вывод результата |

## Алгоритм

```
1. Определить provider из --provider флага (ProviderOption)
2. Если provider === 'all':
   │  providers = ['anthropic', 'openai', 'openrouter']
   └── Иначе:
      providers = [provider]
3. Для каждого provider из providers:
   │  Выбрать CostRepository
   │  parseDateRange(period, from, to) → DateRange
   │  Сформировать CostReportQuery (dateRange, groupBy)
   │  costRepository.query(query) → CostRecord[]
   └── Объединить все записи, отсортировать по date
4. Если sumOnly:
   │  total = records.reduce(sum of amountDollars)
   │  currency = records[0].currency ?? 'USD'
   │  costPresenter.presentSum(total, currency)
   └── Иначе:
      costPresenter.present(records)
```

> При `all` запросы к провайдерам выполняются параллельно (`Promise.all`).
> Если один из провайдеров не имеет сохранённого ключа — ошибка пробрасывается как обычно.

## Выходные данные

**Table mode** (по умолчанию):

```
┌────────────┬──────────────────┬─────────────────┬──────────────┬────────────┬──────┐
│ Date       │ Description      │ Model           │ Amount (USD) │ Token Type │ Tier │
├────────────┼──────────────────┼─────────────────┼──────────────┼────────────┼──────┤
│ 2026-02-10 │ API Usage        │ claude-sonnet-4 │ 0.0523       │ input      │ -    │
└────────────┴──────────────────┴─────────────────┴──────────────┴────────────┴──────┘
```

**JSON mode** (`--json`): массив `CostRecord[]` в формате JSON с отступом 2.

**Sum mode** (`--sum`): `Total: $12.34 USD`

**Sum + JSON** (`--sum --json`): `{ "total": 12.34, "currency": "USD" }`

**Пустой результат**: `No data found for the specified period.`

## Ошибки

| Ситуация | Сообщение |
|----------|-----------|
| API-ключ не сохранён | `No API key stored for <provider>. Run: llm-cost config set-key --provider <provider>` |
| Ошибка API (HTTP != 200) | `Cost API error (<status>): <body>`, `OpenAI Cost API error (<status>): <body>`, или `OpenRouter Activity API error (<status>): <body>` |
| Прочие ошибки | Текст ошибки в stderr, exit code 1 |

## Примеры

```bash
llm-cost cost
llm-cost cost --period 30d
llm-cost cost --provider openai --period 7d
llm-cost cost --from 2026-01-01 --to 2026-01-31
llm-cost cost --group-by workspace_id,description
llm-cost cost --sum
llm-cost cost --sum --json
llm-cost cost --provider openai --sum
llm-cost cost --json
llm-cost cost --provider all
llm-cost cost --provider all --sum
llm-cost cost --provider all --json
llm-cost cost --provider openrouter
llm-cost cost --provider openrouter --sum
llm-cost cost --provider openrouter --json
```
