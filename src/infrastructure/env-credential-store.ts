import type { CredentialStore } from '../application/ports/credential-store.port.js';

export function createEnvCredentialStore(envVarName: string): CredentialStore {
  return {
    async save() {
      throw new Error(
        `Cannot store credentials in environment variables. Set ${envVarName} manually.`,
      );
    },

    async load() {
      const value = process.env[envVarName];
      if (!value) {
        throw new Error(`Environment variable ${envVarName} is not set.`);
      }
      return value;
    },

    async clear() {
      throw new Error(
        `Cannot remove credentials from environment variables. Unset ${envVarName} manually.`,
      );
    },
  };
}
