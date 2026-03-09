export type Provider = 'anthropic' | 'openai' | 'openrouter';
export type ProviderOption = Provider | 'all';

export type DateRange = {
  startingAt: string;
  endingAt: string;
};

export type UsageRecord = {
  provider: Provider;
  date: string;
  model: string | null;
  uncachedInputTokens: number;
  cachedInputTokens: number;
  cacheCreationTokens: number;
  outputTokens: number;
  webSearchRequests: number;
  apiKeyId: string | null;
  workspaceId: string | null;
  serviceTier: string | null;
};

export type CostRecord = {
  provider: Provider;
  date: string;
  description: string | null;
  model: string | null;
  amountDollars: number;
  currency: string;
  tokenType: string | null;
  costType: string | null;
  serviceTier: string | null;
};

export type UsageReportQuery = {
  dateRange: DateRange;
  models?: string[];
  apiKeyIds?: string[];
  groupBy?: string[];
  bucketWidth?: '1d' | '1h' | '1m';
};

export type CostReportQuery = {
  dateRange: DateRange;
  groupBy?: string[];
};
