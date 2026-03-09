# Use Case: ShowApiKey

## Назначение

Показать сохранённый Admin API-ключ в замаскированном виде для проверки, что ключ настроен.

## CLI-команда

```bash
llm-cost config show [--provider <provider>]
```

## Расположение

- Use case: `src/application/use-cases/show-api-key.use-case.ts`
- Command: `src/presentation/commands/config.command.ts`

## Входные параметры

| Параметр | Тип | Источник | Описание |
|----------|-----|----------|----------|
| `provider` | `Provider` | `--provider` flag (default: `anthropic`) | Провайдер |

## Зависимости (порты)

| Порт | Описание |
|------|----------|
| `CredentialStore` | Загрузка credential из хранилища (выбирается по provider) |

## Алгоритм

```
1. Определить provider из --provider флага
2. Выбрать CredentialStore для данного provider (CompositeCredentialStore)
3. credentialStore.load() → key
   └── CompositeCredentialStore пробует:
       a. KeychainCredentialStore → getPassword(service, account) via cross-keychain
       b. EnvCredentialStore → process.env[LLM_COST_<PROVIDER>_API_KEY]
4. maskApiKey(key) → masked
   - Если длина <= 19: "***"
   - Иначе: первые 15 символов + "..." + последние 4 символа
5. credentialStore.source() → источник ('keychain' | 'env' | null)
6. Вывод: masked + " (source)" в stdout
   - keychain: "sk-ant-admin01R...xY9z (keychain)"
   - env: "sk-ant-admin01R...xY9z (env: LLM_COST_ANTHROPIC_API_KEY)"
```

## Выходные данные

Маскированный ключ с указанием источника:

```
sk-ant-admin01R...xY9z (keychain)
sk-ant-admin01R...xY9z (env: LLM_COST_ANTHROPIC_API_KEY)
```

## Ошибки

| Ситуация | Сообщение |
|----------|-----------|
| Ключ не сохранён (ни keychain, ни env) | `No API key stored for <provider>. Run: llm-cost config set-key --provider <provider>, or set LLM_COST_<PROVIDER>_API_KEY` |
| Ошибка keychain | Ошибка из cross-keychain |
