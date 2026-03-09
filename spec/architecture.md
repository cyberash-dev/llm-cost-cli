# Architecture

## Overview

**llm-cost-cli** -- CLI-утилита для получения отчётов об использовании токенов и расходах через Anthropic и OpenAI Admin API. Результаты выводятся в формате таблицы или JSON. API-ключи хранятся в системном keychain.

- **Package**: `llm-cost-cli`
- **Binary**: `llm-cost`
- **Platform**: macOS, Linux, Windows (cross-platform keychain via cross-keychain)
- **Runtime**: Node.js >= 18
- **Module system**: ESM

## Tech Stack

| Category | Tool | Version |
|----------|------|---------|
| Language | TypeScript | 5.9 |
| CLI framework | commander | 14.x |
| Interactive prompts | @inquirer/prompts | 8.x |
| Table output | cli-table3 | 0.6.x |
| Colors | chalk | 5.x |
| Keychain | cross-keychain | 1.x |
| Bundler | tsdown | 0.20.x |
| Linter / Formatter | Biome | 2.x |

## Architectural Pattern

Приложение следует принципам **Clean Architecture** (Hexagonal / Ports & Adapters):

```mermaid
graph TB
  subgraph Presentation ["Presentation Layer"]
    direction LR
    P1["config.command.ts"]
    P2["usage.command.ts"]
    P3["cost.command.ts"]
  end

  subgraph Application ["Application Layer"]
    direction LR
    UC["Use Cases\nGetUsageReport | GetCostReport\nStoreApiKey | ShowApiKey | RemoveApiKey"]
    AP["Ports\nCredentialStore | UsagePresenter | CostPresenter"]
    AH["Helpers\nparseDateRange | isValidAdminKeyForProvider | maskApiKey"]
  end

  subgraph Domain ["Domain Layer"]
    direction LR
    E["Entities\nProvider | DateRange | UsageRecord | CostRecord\nUsageReportQuery | CostReportQuery"]
    DP["Ports\nUsageRepository | CostRepository"]
  end

  subgraph Infrastructure ["Infrastructure Layer"]
    direction LR
    IR["AnthropicUsageRepository | OpenAIUsageRepository\nAnthropicCostRepository | OpenAICostRepository"]
    IC["KeychainCredentialStore"]
    IP["TablePresenter | JsonPresenter"]
  end

  Presentation --> Application
  Application --> Domain
  Infrastructure -.->|implements| Domain
  Infrastructure -.->|implements| Application
```

## Layer Details

### Domain Layer (`src/domain/`)

Содержит чистые типы данных и порты репозиториев. Не имеет зависимостей на внешние пакеты.

**Entities** (value objects):
- `Provider` -- идентификатор LLM-провайдера (`'anthropic' | 'openai'`)
- `DateRange` -- временной диапазон запроса
- `UsageRecord` -- запись об использовании токенов (с полем `provider`)
- `CostRecord` -- запись о расходах (с полем `provider`)
- `UsageReportQuery` -- параметры запроса usage
- `CostReportQuery` -- параметры запроса cost

**Ports** (repository interfaces):
- `UsageRepository` -- получение данных об использовании
- `CostRepository` -- получение данных о расходах

### Application Layer (`src/application/`)

Бизнес-логика приложения. Зависит только от Domain Layer.

**Use Cases**:
- `GetUsageReport` -- получить отчёт об использовании токенов
- `GetCostReport` -- получить отчёт о расходах
- `StoreApiKey` -- сохранить API-ключ (с валидацией по провайдеру)
- `ShowApiKey` -- показать замаскированный API-ключ
- `RemoveApiKey` -- удалить API-ключ

**Ports** (application-level interfaces):
- `CredentialStore` -- сохранение/загрузка/удаление credentials
- `UsagePresenter` -- вывод данных usage
- `CostPresenter` -- вывод данных cost

**Helpers**:
- `parseDateRange()` -- парсинг `--period`, `--from`, `--to` в `DateRange`
- `isValidAdminKeyForProvider()` -- валидация префикса ключа по провайдеру
- `maskApiKey()` -- маскирование ключа для отображения

### Infrastructure Layer (`src/infrastructure/`)

Реализации всех портов. Единственный слой с внешними зависимостями.

| Adapter | Port | Описание |
|---------|------|----------|
| `AnthropicUsageRepository` | `UsageRepository` | HTTP-клиент к Anthropic `/v1/organizations/usage_report/messages` |
| `AnthropicCostRepository` | `CostRepository` | HTTP-клиент к Anthropic `/v1/organizations/cost_report` |
| `OpenAIUsageRepository` | `UsageRepository` | HTTP-клиент к OpenAI `/v1/organization/usage/completions` |
| `OpenAICostRepository` | `CostRepository` | HTTP-клиент к OpenAI `/v1/organization/costs` |
| `KeychainCredentialStore` | `CredentialStore` | Системный keychain через cross-keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service) |
| `TablePresenter` | `UsagePresenter & CostPresenter` | Вывод в виде таблицы (cli-table3 + chalk) |
| `JsonPresenter` | `UsagePresenter & CostPresenter` | Вывод в формате JSON |

### Presentation Layer (`src/presentation/`)

CLI-команды, зарегистрированные через `commander`. Каждая команда:
1. Парсит аргументы из CLI (включая `--provider`)
2. Выбирает нужный репозиторий/хранилище по провайдеру
3. Создаёт экземпляр use case с нужными зависимостями
4. Вызывает use case
5. Обрабатывает ошибки и выводит в stderr

| Command | Use Case(s) | --provider |
|---------|-------------|------------|
| `config set-key` | `StoreApiKey` | да |
| `config show` | `ShowApiKey` | да |
| `config remove-key` | `RemoveApiKey` | да |
| `usage` | `GetUsageReport` | да |
| `cost` | `GetCostReport` | да |

## Composition Root (`src/index.ts`)

Точка входа, где собираются все зависимости:

```mermaid
graph LR
  AKCS["KeychainCredentialStore\n(anthropic)"] --> |load| AUR & ACR
  OKCS["KeychainCredentialStore\n(openai)"] --> |load| OUR & OCR
  AUR["AnthropicUsageRepository"]
  ACR["AnthropicCostRepository"]
  OUR["OpenAIUsageRepository"]
  OCR["OpenAICostRepository"]
  TP["TablePresenter"]
  JP["JsonPresenter"]
  TP -.- |"--json=false"| PRES
  JP -.- |"--json=true"| PRES["getPresenter()"]

  subgraph Commander
    CONFIG["config"] --> AKCS & OKCS
    USAGE["usage"] --> AUR & OUR & PRES
    COST["cost"] --> ACR & OCR & PRES
  end
```

API-ключ загружается лениво -- `credentialStore.load()` вызывается только при фактическом запросе к API.

## Data Flow

### Usage / Cost Report

```mermaid
sequenceDiagram
  participant CLI as CLI args
  participant CMD as Command
  participant UC as Use Case
  participant REPO as Repository
  participant KC as Keychain
  participant API as Provider API
  participant PR as Presenter

  CLI->>CMD: flags & options (--provider)
  CMD->>CMD: select repository by provider
  CMD->>UC: parsed params
  UC->>UC: parseDateRange → DateRange
  UC->>REPO: query(ReportQuery)
  REPO->>KC: getApiKey()
  KC-->>REPO: api-key
  loop while has_more
    REPO->>API: GET endpoint
    API-->>REPO: { data, has_more, next_page }
  end
  REPO->>REPO: map raw → domain entity[]
  REPO-->>UC: UsageRecord[] | CostRecord[]
  UC->>PR: present(records)
  PR-->>CLI: stdout (table | JSON)
```

### API Key Storage

```mermaid
sequenceDiagram
  participant U as User
  participant CMD as config set-key --provider
  participant UC as StoreApiKey
  participant KC as KeychainCredentialStore

  CMD->>U: Enter your <provider> Admin API key (masked)
  U-->>CMD: api-key
  CMD->>UC: key, provider
  UC->>UC: trim + validate prefix for provider
  UC->>KC: save(key)
  KC->>KC: setPassword(service, account, key)
```

## External API

### Anthropic Admin API (`https://api.anthropic.com`)

| Endpoint | Method | Path |
|----------|--------|------|
| Usage Report | GET | `/v1/organizations/usage_report/messages` |
| Cost Report | GET | `/v1/organizations/cost_report` |

**Headers**: `anthropic-version: 2023-06-01`, `x-api-key: <admin-api-key>`
**Pagination**: cursor-based через `has_more` + `next_page` token.
**API-ключ**: `sk-ant-admin...`

### OpenAI Admin API (`https://api.openai.com`)

| Endpoint | Method | Path |
|----------|--------|------|
| Usage Report | GET | `/v1/organization/usage/completions` |
| Cost Report | GET | `/v1/organization/costs` |

**Headers**: `Authorization: Bearer <admin-api-key>`
**Pagination**: cursor-based через `has_more` + `next_page` token.
**API-ключ**: `sk-admin-...`
**Даты**: unix timestamps (секунды)
**Суммы**: в долларах (не в центах как у Anthropic)

## Security

- API-ключи хранятся в системном keychain (service: `llm-cost-cli`, account: `llm-cost-cli:<provider>`) через cross-keychain (macOS Keychain / Windows Credential Manager / Linux Secret Service), никогда не записываются на диск в plaintext
- Ключи передаются только на соответствующие API по HTTPS
- Никаких config-файлов: все настройки через CLI-флаги
- Никакого кэширования: данные не сохраняются локально, вывод только в stdout

## Build & Distribution

См. [deploy.md](deploy.md)
