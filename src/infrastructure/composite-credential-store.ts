import type { CredentialStore } from '../application/ports/credential-store.port.js';
import type { Provider } from '../domain/entities.js';

export function createCompositeCredentialStore(
  primary: CredentialStore,
  fallback: CredentialStore,
  provider: Provider,
  envVarName: string,
): CredentialStore {
  let lastSource: string | null = null;

  return {
    async save(credential: string) {
      await primary.save(credential);
    },

    async load() {
      try {
        const value = await primary.load();
        lastSource = 'keychain';
        return value;
      } catch {
        // primary failed, try fallback
      }

      try {
        const value = await fallback.load();
        lastSource = `env: ${envVarName}`;
        return value;
      } catch {
        // fallback also failed
      }

      lastSource = null;
      throw new Error(
        `No API key stored for ${provider}. Run: llm-cost config set-key --provider ${provider}, or set ${envVarName}`,
      );
    },

    async clear() {
      await primary.clear();
    },

    source() {
      return lastSource;
    },
  };
}
