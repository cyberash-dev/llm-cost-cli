import type { CostRepository } from '../domain/cost-repository.port.js';
import type { CostRecord, CostReportQuery } from '../domain/entities.js';

const BASE_URL = 'https://api.anthropic.com';
const COST_ENDPOINT = '/v1/organizations/cost_report';

type RawCostBucket = {
  starting_at: string;
  ending_at: string;
  results: RawCostResult[];
};

type RawCostResult = {
  amount: string;
  currency: string;
  description: string | null;
  model: string | null;
  token_type: string | null;
  cost_type: string | null;
  service_tier: string | null;
  workspace_id: string | null;
};

type RawCostResponse = {
  data: RawCostBucket[];
  has_more: boolean;
  next_page?: string;
};

function mapToCostRecord(
  bucket: RawCostBucket,
  result: RawCostResult,
): CostRecord {
  const amountCents = parseFloat(result.amount);
  const amountDollars = Number.isNaN(amountCents) ? 0 : amountCents / 100;
  return {
    provider: 'anthropic',
    date: bucket.starting_at,
    description: result.description ?? null,
    model: result.model ?? null,
    amountDollars,
    currency: result.currency ?? 'USD',
    tokenType: result.token_type ?? null,
    costType: result.cost_type ?? null,
    serviceTier: result.service_tier ?? null,
  };
}

export function createAnthropicCostRepository(
  getApiKey: () => Promise<string>,
): CostRepository {
  return {
    async query(params: CostReportQuery) {
      const apiKey = await getApiKey();
      const allRecords: CostRecord[] = [];
      let page: string | undefined;

      do {
        const searchParams = new URLSearchParams();
        searchParams.set('starting_at', params.dateRange.startingAt);
        searchParams.set('ending_at', params.dateRange.endingAt);
        searchParams.set('bucket_width', '1d');

        if (params.groupBy?.length) {
          for (const g of params.groupBy) {
            searchParams.append('group_by[]', g);
          }
        }
        if (page) {
          searchParams.set('page', page);
        }

        const url = `${BASE_URL}${COST_ENDPOINT}?${searchParams}`;
        const res = await fetch(url, {
          headers: {
            'anthropic-version': '2023-06-01',
            'x-api-key': apiKey,
          },
        });

        if (!res.ok) {
          const body = await res.text();
          throw new Error(
            `Cost API error (${res.status}): ${body || res.statusText}`,
          );
        }

        const json = (await res.json()) as RawCostResponse;

        for (const bucket of json.data) {
          for (const result of bucket.results) {
            allRecords.push(mapToCostRecord(bucket, result));
          }
        }

        page = json.has_more ? json.next_page : undefined;
      } while (page);

      return allRecords;
    },
  };
}
