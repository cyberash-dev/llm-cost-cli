# Use Case: RemoveApiKey

## Назначение

Удалить сохранённый Admin API-ключ из системного keychain.

## CLI-команда

```bash
llm-cost config remove-key [--provider <provider>]
```

## Расположение

- Use case: `src/application/use-cases/remove-api-key.use-case.ts`
- Command: `src/presentation/commands/config.command.ts`

## Входные параметры

| Параметр | Тип | Источник | Описание |
|----------|-----|----------|----------|
| `provider` | `Provider` | `--provider` flag (default: `anthropic`) | Провайдер |

## Зависимости (порты)

| Порт | Описание |
|------|----------|
| `CredentialStore` | Удаление credential из хранилища (выбирается по provider) |

## Алгоритм

```
1. Определить provider из --provider флага
2. Выбрать CredentialStore для данного provider
3. credentialStore.clear()
   └── KeychainCredentialStore:
       deletePassword('llm-cost-cli', 'llm-cost-cli:<provider>') via cross-keychain
4. Вывод: "API key removed for <provider>."
```

## Идемпотентность

Если ключ уже был удалён или не существует, адаптер KeychainCredentialStore перехватывает `PasswordDeleteError("Password not found")` и завершается без ошибки.

## Ошибки

| Ситуация | Сообщение |
|----------|-----------|
| Ошибка keychain | Ошибка из cross-keychain |
