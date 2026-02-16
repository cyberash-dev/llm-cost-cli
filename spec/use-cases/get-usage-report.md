# Use Case: GetUsageReport

## Назначение

Получить отчёт об использовании токенов за указанный период и вывести результат пользователю в виде таблицы или JSON.

## CLI-команда

```bash
claude-cost usage [options]
```

## Расположение

- Use case: `src/application/use-cases/get-usage-report.use-case.ts`
- Command: `src/presentation/commands/usage.command.ts`

## Входные параметры

| Параметр | Тип | CLI-флаг | Default | Описание |
|----------|-----|----------|---------|----------|
| `period` | `string?` | `--period` | `7d` | Период (например `7d`, `30d`, `90d`) |
| `from` | `string?` | `--from` | - | Дата начала (YYYY-MM-DD или ISO) |
| `to` | `string?` | `--to` | - | Дата конца (YYYY-MM-DD или ISO) |
| `models` | `string[]?` | `--model` | все | Фильтр по моделям (comma-separated) |
| `apiKeyIds` | `string[]?` | `--api-keys` | все | Фильтр по API key ID (comma-separated) |
| `groupBy` | `string[]?` | `--group-by` | `['model']` | Группировка (comma-separated) |
| `bucketWidth` | `'1d' \| '1h' \| '1m'` | `--bucket` | `'1d'` | Гранулярность |
| (output format) | `boolean` | `--json` | `false` | Формат вывода |

## Зависимости (порты)

| Порт | Описание |
|------|----------|
| `UsageRepository` | Получение данных из Anthropic Usage API |
| `UsagePresenter` | Форматирование и вывод результата |

## Алгоритм

```
1. parseDateRange(period, from, to) → DateRange
2. Сформировать UsageReportQuery:
   - dateRange
   - models (если указано)
   - apiKeyIds (если указано)
   - groupBy (если указано)
   - bucketWidth (default: '1d')
3. usageRepository.query(query) → UsageRecord[]
   └── внутри: загрузка API key из Keychain → HTTP GET → пагинация → маппинг
4. usagePresenter.present(records)
   ├── TablePresenter → таблица в stdout
   └── JsonPresenter  → JSON в stdout
```

## Выходные данные

**Table mode** (по умолчанию):

```
┌────────────┬─────────────────┬──────────────┬───────────────┬───────────────┬──────────────┐
│ Date       │ Model           │ Input Tokens │ Cached Tokens │ Output Tokens │ Web Searches │
├────────────┼─────────────────┼──────────────┼───────────────┼───────────────┼──────────────┤
│ 2026-02-10 │ claude-sonnet-4 │ 15420        │ 3200          │ 8100          │ 0            │
└────────────┴─────────────────┴──────────────┴───────────────┴───────────────┴──────────────┘
```

**JSON mode** (`--json`): массив `UsageRecord[]` в формате JSON с отступом 2.

**Пустой результат**: `No data found for the specified period.`

## Ошибки

| Ситуация | Сообщение |
|----------|-----------|
| API-ключ не сохранён | `No API key stored. Run: claude-cost config set-key` |
| Ошибка API (HTTP != 200) | `Usage API error (<status>): <body>` |
| Прочие ошибки | Текст ошибки в stderr, exit code 1 |

## Примеры

```bash
claude-cost usage
claude-cost usage --period 30d
claude-cost usage --from 2026-01-01 --to 2026-01-31
claude-cost usage --model claude-sonnet-4,claude-opus-4
claude-cost usage --api-keys apikey_01Rj --group-by model,api_key_id
claude-cost usage --bucket 1h --json
```
