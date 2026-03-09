# Use Case: StoreApiKey

## Назначение

Сохранить Admin API-ключ провайдера в системном keychain для последующего использования при запросах к API.

## CLI-команда

```bash
llm-cost config set-key [--provider <provider>]
```

## Расположение

- Use case: `src/application/use-cases/store-api-key.use-case.ts`
- Command: `src/presentation/commands/config.command.ts`

## Входные параметры

| Параметр | Тип | Источник | Описание |
|----------|-----|----------|----------|
| `key` | `string` | Интерактивный prompt (masked) | Admin API-ключ |
| `provider` | `Provider` | `--provider` flag (default: `anthropic`) | Провайдер |

## Зависимости (порты)

| Порт | Описание |
|------|----------|
| `CredentialStore` | Сохранение credential в хранилище (выбирается по provider) |

## Алгоритм

```
1. Определить provider из --provider флага (default: anthropic)
2. Выбрать CredentialStore для данного provider
3. Показать интерактивный prompt с маскированным вводом
   - anthropic: "Enter your anthropic Admin API key (sk-ant-admin...):"
   - openai: "Enter your openai Admin API key (sk-admin-..., sk-proj-..., or sk-svcacct-...):"
4. Валидация на уровне prompt: ключ не может быть пустым
5. Use case:
   a. trim(key)
   b. Проверка: key не пустой → иначе Error("API key cannot be empty")
   c. isValidAdminKeyForProvider(key, provider)
      - anthropic: начинается с "sk-ant-admin"
      - openai: начинается с "sk-admin-", "sk-proj-" или "sk-svcacct-"
      → иначе Error с подсказкой для соответствующего провайдера
   d. credentialStore.save(key)
6. Вывод: "API key stored successfully for <provider>."
```

## Хранилище (KeychainCredentialStore)

Реализация `save()`:
1. `setPassword('llm-cost-cli', 'llm-cost-cli:<provider>', key)` через cross-keychain
2. cross-keychain автоматически обновляет существующий credential

## Ошибки

| Ситуация | Сообщение |
|----------|-----------|
| Пустой ключ | `API key cannot be empty` |
| Невалидный префикс (anthropic) | `Invalid admin API key: must start with sk-ant-admin. Get your key from Claude Console → Settings → Admin Keys.` |
| Невалидный префикс (openai) | `Invalid API key: must start with sk-admin-, sk-proj-, or sk-svcacct-. Get your key from OpenAI Platform → Organization → API Keys.` |
| Ошибка keychain | Ошибка из cross-keychain |

## Валидация

- Ключ обрезается (trim)
- Должен быть непустым
- Должен начинаться с правильного префикса для провайдера:
  - anthropic: `sk-ant-admin`
  - openai: `sk-admin-`, `sk-proj-` или `sk-svcacct-`
