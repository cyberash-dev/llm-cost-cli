import type { UsageRecord, UsageReportQuery } from '../domain/entities.js';
import type { UsageRepository } from '../domain/usage-repository.port.js';

const BASE_URL = 'https://api.anthropic.com';
const USAGE_ENDPOINT = '/v1/organizations/usage_report/messages';

type RawUsageBucket = {
  starting_at: string;
  ending_at: string;
  results: RawUsageResult[];
};

type RawUsageResult = {
  api_key_id: string | null;
  uncached_input_tokens: number;
  cache_read_input_tokens: number;
  cache_creation?: {
    ephemeral_1h_input_tokens?: number;
    ephemeral_5m_input_tokens?: number;
  };
  output_tokens: number;
  server_tool_use?: { web_search_requests?: number };
  model: string | null;
  workspace_id: string | null;
  service_tier: string | null;
};

type RawUsageResponse = {
  data: RawUsageBucket[];
  has_more: boolean;
  next_page?: string;
};

function mapToUsageRecord(
  bucket: RawUsageBucket,
  result: RawUsageResult,
): UsageRecord {
  const cacheCreation = result.cache_creation ?? {};
  const cacheCreationTokens =
    (cacheCreation.ephemeral_1h_input_tokens ?? 0) +
    (cacheCreation.ephemeral_5m_input_tokens ?? 0);
  return {
    provider: 'anthropic',
    date: bucket.starting_at,
    model: result.model ?? null,
    uncachedInputTokens: result.uncached_input_tokens,
    cachedInputTokens: result.cache_read_input_tokens,
    cacheCreationTokens,
    outputTokens: result.output_tokens,
    webSearchRequests: result.server_tool_use?.web_search_requests ?? 0,
    apiKeyId: result.api_key_id ?? null,
    workspaceId: result.workspace_id ?? null,
    serviceTier: result.service_tier ?? null,
  };
}

export function createAnthropicUsageRepository(
  getApiKey: () => Promise<string>,
): UsageRepository {
  return {
    async query(params: UsageReportQuery) {
      const apiKey = await getApiKey();
      const allRecords: UsageRecord[] = [];
      let page: string | undefined;

      do {
        const searchParams = new URLSearchParams();
        searchParams.set('starting_at', params.dateRange.startingAt);
        searchParams.set('ending_at', params.dateRange.endingAt);
        searchParams.set('bucket_width', params.bucketWidth ?? '1d');

        if (params.models?.length) {
          for (const m of params.models) {
            searchParams.append('models[]', m);
          }
        }
        if (params.apiKeyIds?.length) {
          for (const id of params.apiKeyIds) {
            searchParams.append('api_key_ids[]', id);
          }
        }
        if (params.groupBy?.length) {
          for (const g of params.groupBy) {
            searchParams.append('group_by[]', g);
          }
        }
        if (page) {
          searchParams.set('page', page);
        }

        const url = `${BASE_URL}${USAGE_ENDPOINT}?${searchParams}`;
        const res = await fetch(url, {
          headers: {
            'anthropic-version': '2023-06-01',
            'x-api-key': apiKey,
          },
        });

        if (!res.ok) {
          const body = await res.text();
          throw new Error(
            `Usage API error (${res.status}): ${body || res.statusText}`,
          );
        }

        const json = (await res.json()) as RawUsageResponse;

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
