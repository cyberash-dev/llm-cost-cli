# Use Case: GetUsageReport

## Назначение

Получить отчёт об использовании токенов за указанный период и вывести результат пользователю в виде таблицы или JSON.

## CLI-команда

```bash
llm-cost usage [options]
```

## Расположение

- Use case: `src/application/use-cases/get-usage-report.use-case.ts`
- Command: `src/presentation/commands/usage.command.ts`

## Входные параметры

| Параметр | Тип | CLI-флаг | Default | Описание |
|----------|-----|----------|---------|----------|
| `provider` | `Provider` | `--provider` | `anthropic` | Провайдер |
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
| `UsageRepository` | Получение данных из Usage API (выбирается по provider) |
| `UsagePresenter` | Форматирование и вывод результата |

## Алгоритм

```
1. Определить provider из --provider флага
2. Выбрать UsageRepository для данного provider
3. parseDateRange(period, from, to) → DateRange
4. Сформировать UsageReportQuery:
   - dateRange
   - models (если указано)
   - apiKeyIds (если указано)
   - groupBy (если указано)
   - bucketWidth (default: '1d')
5. usageRepository.query(query) → UsageRecord[]
   └── внутри: загрузка API key из Keychain → HTTP GET → пагинация → маппинг
6. usagePresenter.present(records)
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
| API-ключ не сохранён | `No API key stored for <provider>. Run: llm-cost config set-key --provider <provider>` |
| Ошибка API (HTTP != 200) | `Usage API error (<status>): <body>`, `OpenAI Usage API error (<status>): <body>`, или `OpenRouter Activity API error (<status>): <body>` |
| Прочие ошибки | Текст ошибки в stderr, exit code 1 |

## Примеры

```bash
llm-cost usage
llm-cost usage --period 30d
llm-cost usage --provider openai --period 7d
llm-cost usage --from 2026-01-01 --to 2026-01-31
llm-cost usage --model claude-sonnet-4,claude-opus-4
llm-cost usage --api-keys apikey_01Rj --group-by model,api_key_id
llm-cost usage --bucket 1h --json
llm-cost usage --provider openai --json
llm-cost usage --provider openrouter
llm-cost usage --provider openrouter --json
```
