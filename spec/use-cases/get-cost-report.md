# Use Case: GetCostReport

## Назначение

Получить отчёт о расходах за указанный период и вывести результат пользователю в виде таблицы, JSON, или суммы.

## CLI-команда

```bash
claude-cost cost [options]
```

## Расположение

- Use case: `src/application/use-cases/get-cost-report.use-case.ts`
- Command: `src/presentation/commands/cost.command.ts`

## Входные параметры

| Параметр | Тип | CLI-флаг | Default | Описание |
|----------|-----|----------|---------|----------|
| `period` | `string?` | `--period` | `7d` | Период (например `7d`, `30d`, `90d`) |
| `from` | `string?` | `--from` | - | Дата начала (YYYY-MM-DD или ISO) |
| `to` | `string?` | `--to` | - | Дата конца (YYYY-MM-DD или ISO) |
| `groupBy` | `('workspace_id' \| 'description')[]?` | `--group-by` | `['description']` | Группировка (comma-separated) |
| `sumOnly` | `boolean` | `--sum` | `false` | Вывести только итоговую сумму |
| (output format) | `boolean` | `--json` | `false` | Формат вывода |

## Зависимости (порты)

| Порт | Описание |
|------|----------|
| `CostRepository` | Получение данных из Anthropic Cost API |
| `CostPresenter` | Форматирование и вывод результата |

## Алгоритм

```
1. parseDateRange(period, from, to) → DateRange
2. Сформировать CostReportQuery:
   - dateRange
   - groupBy (если указано)
3. costRepository.query(query) → CostRecord[]
   └── внутри: загрузка API key из Keychain → HTTP GET → пагинация → маппинг
4. Если sumOnly:
   │  total = records.reduce(sum of amountDollars)
   │  currency = records[0].currency ?? 'USD'
   │  costPresenter.presentSum(total, currency)
   └── Иначе:
      costPresenter.present(records)
```

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
| API-ключ не сохранён | `No API key stored. Run: claude-cost config set-key` |
| Ошибка API (HTTP != 200) | `Cost API error (<status>): <body>` |
| Прочие ошибки | Текст ошибки в stderr, exit code 1 |

## Примеры

```bash
claude-cost cost
claude-cost cost --period 30d
claude-cost cost --from 2026-01-01 --to 2026-01-31
claude-cost cost --group-by workspace_id,description
claude-cost cost --sum
claude-cost cost --sum --json
claude-cost cost --json
```
