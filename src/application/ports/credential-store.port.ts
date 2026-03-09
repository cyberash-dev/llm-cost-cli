export type CredentialStore = {
  save(credential: string): Promise<void>;
  load(): Promise<string>;
  clear(): Promise<void>;
  source?: () => string | null;
};
