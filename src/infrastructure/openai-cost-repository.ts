import type { CostRepository } from '../domain/cost-repository.port.js';
import type { CostRecord, CostReportQuery } from '../domain/entities.js';

const BASE_URL = 'https://api.openai.com';
const COST_ENDPOINT = '/v1/organization/costs';

type RawOpenAICostBucket = {
  start_time: number;
  end_time: number;
  results: RawOpenAICostResult[];
};

type RawOpenAICostResult = {
  amount: {
    value: number;
    currency: string;
  };
  line_item: string | null;
  project_id: string | null;
};

type RawOpenAICostResponse = {
  data: RawOpenAICostBucket[];
  has_more: boolean;
  next_page?: string;
};

const GROUP_BY_MAP: Record<string, string> = {
  description: 'line_item',
  workspace_id: 'project_id',
};

function toUnixSeconds(iso: string): number {
  return Math.floor(new Date(iso).getTime() / 1000);
}

function translateGroupBy(groupBy: string[]): string[] {
  return groupBy
    .map((g) => GROUP_BY_MAP[g] ?? g)
    .filter((g) => g === 'line_item' || g === 'project_id');
}

function mapToCostRecord(
  bucket: RawOpenAICostBucket,
  result: RawOpenAICostResult,
): CostRecord {
  return {
    provider: 'openai',
    date: new Date(bucket.start_time * 1000).toISOString(),
    description: result.line_item ?? null,
    model: null,
    amountDollars: Number(result.amount.value) || 0,
    currency: result.amount.currency ?? 'USD',
    tokenType: null,
    costType: null,
    serviceTier: null,
  };
}

export function createOpenAICostRepository(
  getApiKey: () => Promise<string>,
): CostRepository {
  return {
    async query(params: CostReportQuery) {
      const apiKey = await getApiKey();
      const allRecords: CostRecord[] = [];
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
        searchParams.set('bucket_width', '1d');

        if (params.groupBy?.length) {
          for (const g of translateGroupBy(params.groupBy)) {
            searchParams.append('group_by[]', g);
          }
        }

        if (page) {
          searchParams.set('page', page);
        }

        const url = `${BASE_URL}${COST_ENDPOINT}?${searchParams}`;
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });

        if (!res.ok) {
          const body = await res.text();
          throw new Error(
            `OpenAI Cost API error (${res.status}): ${body || res.statusText}`,
          );
        }

        const json = (await res.json()) as RawOpenAICostResponse;

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
