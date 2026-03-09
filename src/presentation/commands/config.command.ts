import type { Command } from 'commander';
import type { CredentialStore } from '../../application/ports/credential-store.port.js';
import { createRemoveApiKeyUseCase } from '../../application/use-cases/remove-api-key.use-case.js';
import { createShowApiKeyUseCase } from '../../application/use-cases/show-api-key.use-case.js';
import { createStoreApiKeyUseCase } from '../../application/use-cases/store-api-key.use-case.js';
import type { Provider } from '../../domain/entities.js';

export function registerConfigCommand(
  program: Command,
  credentialStores: Record<Provider, CredentialStore>,
): void {
  const config = program
    .command('config')
    .description('Manage API key storage');

  config
    .command('set-key')
    .description('Store Admin API key securely in system keychain')
    .option(
      '--provider <provider>',
      'Provider: anthropic, openai, or openrouter',
      'anthropic',
    )
    .action(async (opts) => {
      const provider = opts.provider as Provider;
      const store = credentialStores[provider];
      if (!store) {
        console.error(`Unknown provider: ${provider}`);
        process.exit(1);
      }
      const { password } = await import('@inquirer/prompts');
      const storeApiKey = createStoreApiKeyUseCase(store);
      try {
        const prefixMap: Record<Provider, string> = {
          anthropic: 'sk-ant-admin...',
          openai: 'sk-admin-..., sk-proj-..., or sk-svcacct-...',
          openrouter: 'sk-or-... (Management API key)',
        };
        const prefix = prefixMap[provider];
        const key = await password({
          message: `Enter your ${provider} Admin API key (${prefix}):`,
          mask: true,
          validate: (v) => (v.trim().length > 0 ? true : 'Key cannot be empty'),
        });
        await storeApiKey(key, provider);
        console.log(`API key stored successfully for ${provider}.`);
      } catch (err) {
        console.error(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });

  config
    .command('show')
    .description('Display masked API key')
    .option(
      '--provider <provider>',
      'Provider: anthropic, openai, or openrouter',
      'anthropic',
    )
    .action(async (opts) => {
      const provider = opts.provider as Provider;
      const store = credentialStores[provider];
      if (!store) {
        console.error(`Unknown provider: ${provider}`);
        process.exit(1);
      }
      const showApiKey = createShowApiKeyUseCase(store);
      try {
        const masked = await showApiKey();
        const src = store.source?.();
        const suffix = src ? ` (${src})` : '';
        console.log(`${masked}${suffix}`);
      } catch (err) {
        console.error(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });

  config
    .command('remove-key')
    .description('Remove API key from system keychain')
    .option(
      '--provider <provider>',
      'Provider: anthropic, openai, or openrouter',
      'anthropic',
    )
    .action(async (opts) => {
      const provider = opts.provider as Provider;
      const store = credentialStores[provider];
      if (!store) {
        console.error(`Unknown provider: ${provider}`);
        process.exit(1);
      }
      const removeApiKey = createRemoveApiKeyUseCase(store);
      try {
        await removeApiKey();
        console.log(`API key removed for ${provider}.`);
      } catch (err) {
        console.error(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });
}
