# Use Case: StoreApiKey

## Назначение

Сохранить Admin API-ключ Anthropic в macOS Keychain для последующего использования при запросах к API.

## CLI-команда

```bash
claude-cost config set-key
```

## Расположение

- Use case: `src/application/use-cases/store-api-key.use-case.ts`
- Command: `src/presentation/commands/config.command.ts`

## Входные параметры

| Параметр | Тип | Источник | Описание |
|----------|-----|----------|----------|
| `key` | `string` | Интерактивный prompt (masked) | Admin API-ключ |

## Зависимости (порты)

| Порт | Описание |
|------|----------|
| `CredentialStore` | Сохранение credential в хранилище |

## Алгоритм

```
1. Показать интерактивный prompt с маскированным вводом
   (message: "Enter your Admin API key (sk-ant-admin...):")
2. Валидация на уровне prompt: ключ не может быть пустым
3. Use case:
   a. trim(key)
   b. Проверка: key не пустой → иначе Error("API key cannot be empty")
   c. isValidAdminKey(key) → начинается с "sk-ant-admin"
      → иначе Error("Invalid admin API key: must start with sk-ant-admin...")
   d. credentialStore.save(key)
4. Вывод: "API key stored successfully."
```

## Хранилище (KeychainCredentialStore)

Реализация `save()`:
1. `security add-generic-password -a claude-cost-cli -s claude-cost-cli -w <key> -U`
2. Если ключ уже существует (`already exists`):
   - `security delete-generic-password -a claude-cost-cli -s claude-cost-cli`
   - Повторный вызов `save()`
3. При другой ошибке: `Failed to store credential in Keychain: <message>`

## Ошибки

| Ситуация | Сообщение |
|----------|-----------|
| Пустой ключ | `API key cannot be empty` |
| Невалидный префикс | `Invalid admin API key: must start with sk-ant-admin. Get your key from Claude Console → Settings → Admin Keys.` |
| Ошибка Keychain | `Failed to store credential in Keychain: <details>` |

## Валидация

- Ключ обрезается (trim)
- Должен быть непустым
- Должен начинаться с `sk-ant-admin`
