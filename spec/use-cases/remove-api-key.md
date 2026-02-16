# Use Case: RemoveApiKey

## Назначение

Удалить сохранённый Admin API-ключ из macOS Keychain.

## CLI-команда

```bash
claude-cost config remove-key
```

## Расположение

- Use case: `src/application/use-cases/remove-api-key.use-case.ts`
- Command: `src/presentation/commands/config.command.ts`

## Входные параметры

Нет.

## Зависимости (порты)

| Порт | Описание |
|------|----------|
| `CredentialStore` | Удаление credential из хранилища |

## Алгоритм

```
1. credentialStore.clear()
   └── KeychainCredentialStore:
       security delete-generic-password -a claude-cost-cli -s claude-cost-cli
2. Вывод: "API key removed."
```

## Идемпотентность

Если ключ уже был удалён или не существует, операция завершается без ошибки (ошибки `could not be found` / `The specified item could not be found` подавляются).

## Ошибки

| Ситуация | Сообщение |
|----------|-----------|
| Ошибка Keychain (не "not found") | `Failed to remove credential from Keychain: <details>` |
