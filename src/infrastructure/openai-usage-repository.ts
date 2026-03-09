import type { UsageRecord, UsageReportQuery } from '../domain/entities.js';
import type { UsageRepository } from '../domain/usage-repository.port.js';

const BASE_URL = 'https://api.openai.com';
const USAGE_ENDPOINT = '/v1/organization/usage/completions';

type RawOpenAIBucket = {
  start_time: number;
  end_time: number;
  results: RawOpenAIUsageResult[];
};

type RawOpenAIUsageResult = {
  input_tokens: number;
  output_tokens: number;
  input_cached_tokens: number;
  num_model_requests: number;
  project_id: string | null;
  model?: string | null;
};

type RawOpenAIUsageResponse = {
  data: RawOpenAIBucket[];
  has_more: boolean;
  next_page?: string;
};

function toUnixSeconds(iso: string): number {
  return Math.floor(new Date(iso).getTime() / 1000);
}

function mapToUsageRecord(
  bucket: RawOpenAIBucket,
  result: RawOpenAIUsageResult,
): UsageRecord {
  const uncachedInputTokens = result.input_tokens - result.input_cached_tokens;
  return {
    provider: 'openai',
    date: new Date(bucket.start_time * 1000).toISOString(),
    model: result.model ?? null,
    uncachedInputTokens: uncachedInputTokens > 0 ? uncachedInputTokens : 0,
    cachedInputTokens: result.input_cached_tokens,
    cacheCreationTokens: 0,
    outputTokens: result.output_tokens,
    webSearchRequests: 0,
    apiKeyId: null,
    workspaceId: result.project_id ?? null,
    serviceTier: null,
  };
}

function translateGroupBy(groupBy: string[]): string[] {
  return groupBy.map((g) => (g === 'workspace_id' ? 'project_id' : g));
}

export function createOpenAIUsageRepository(
  getApiKey: () => Promise<string>,
): UsageRepository {
  return {
    async query(params: UsageReportQuery) {
      const apiKey = await getApiKey();
      const allRecords: UsageRecord[] = [];
      let page: string | undefined;

      do {
        const searchParams = new URLSearchParams();
        searchParams.set(
          'start_time',
          String(toUnixSeconds(params.dateRange.startingAt)),
        );
        searchParams.set(
          'end_time',
          String(toUnixSeconds(params.dateRange.endingAt)),
        );
        searchParams.set('bucket_width', params.bucketWidth ?? '1d');

        if (params.groupBy?.length) {
          for (const g of translateGroupBy(params.groupBy)) {
            searchParams.append('group_by[]', g);
          }
        }
        if (page) {
          searchParams.set('page', page);
        }

        const url = `${BASE_URL}${USAGE_ENDPOINT}?${searchParams}`;
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });

        if (!res.ok) {
          const body = await res.text();
          throw new Error(
            `OpenAI Usage API error (${res.status}): ${body || res.statusText}`,
          );
        }

        const json = (await res.json()) as RawOpenAIUsageResponse;

        for (const bucket of json.data) {
          for (const result of bucket.results) {
            allRecords.push(mapToUsageRecord(bucket, result));
          }
        }

        page = json.has_more ? json.next_page : undefined;
      } while (page);

      return allRecords;
    },
  };
}
