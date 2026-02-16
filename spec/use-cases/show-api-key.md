# Use Case: ShowApiKey

## Назначение

Показать сохранённый Admin API-ключ в замаскированном виде для проверки, что ключ настроен.

## CLI-команда

```bash
claude-cost config show
```

## Расположение

- Use case: `src/application/use-cases/show-api-key.use-case.ts`
- Command: `src/presentation/commands/config.command.ts`

## Входные параметры

Нет.

## Зависимости (порты)

| Порт | Описание |
|------|----------|
| `CredentialStore` | Загрузка credential из хранилища |

## Алгоритм

```
1. credentialStore.load() → key
   └── KeychainCredentialStore:
       security find-generic-password -a claude-cost-cli -s claude-cost-cli -w
2. maskApiKey(key) → masked
   - Если длина <= 19: "***"
   - Иначе: первые 15 символов + "..." + последние 4 символа
3. Вывод masked в stdout
```

## Выходные данные

Маскированный ключ, например:

```
sk-ant-admin01R...xY9z
```

## Ошибки

| Ситуация | Сообщение |
|----------|-----------|
| Ключ не сохранён | `No API key stored. Run: claude-cost config set-key` |
| Ошибка Keychain | `Failed to retrieve credential from Keychain: <details>` |
