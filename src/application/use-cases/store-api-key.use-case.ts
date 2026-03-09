import type { Provider } from '../../domain/entities.js';
import { isValidAdminKeyForProvider } from '../date-range.helper.js';
import type { CredentialStore } from '../ports/credential-store.port.js';

const PROVIDER_HINTS: Record<Provider, string> = {
  anthropic:
    'Invalid admin API key: must start with sk-ant-admin. Get your key from Claude Console → Settings → Admin Keys.',
  openai:
    'Invalid API key: must start with sk-admin-, sk-proj-, or sk-svcacct-. Get your key from OpenAI Platform → Organization → API Keys.',
  openrouter:
    'Invalid API key: must start with sk-or-. Get your Management API key from OpenRouter → Settings → API Keys.',
};

export function createStoreApiKeyUseCase(
  credentialStore: CredentialStore,
): (key: string, provider: Provider) => Promise<void> {
  return async (key: string, provider: Provider) => {
    const trimmed = key.trim();
    if (!trimmed) throw new Error('API key cannot be empty');
    if (!isValidAdminKeyForProvider(trimmed, provider)) {
      throw new Error(PROVIDER_HINTS[provider]);
    }
    await credentialStore.save(trimmed);
  };
}
