import { deletePassword, getPassword, setPassword } from 'cross-keychain';
import type { CredentialStore } from '../application/ports/credential-store.port.js';
import type { Provider } from '../domain/entities.js';

const SERVICE = 'llm-cost-cli';

export function createKeychainCredentialStore(
  provider: Provider,
): CredentialStore {
  const account = `llm-cost-cli:${provider}`;

  return {
    async save(credential: string) {
      await setPassword(SERVICE, account, credential);
    },

    async load() {
      const value = await getPassword(SERVICE, account);
      if (!value) {
        throw new Error(
          `No API key stored for ${provider}. Run: llm-cost config set-key --provider ${provider}`,
        );
      }
      return value;
    },

    async clear() {
      try {
        await deletePassword(SERVICE, account);
      } catch (err) {
        if (err instanceof Error && err.message === 'Password not found') {
          return;
        }
        throw err;
      }
    },
  };
}
