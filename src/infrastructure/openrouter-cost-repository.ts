import type { CostRepository } from '../domain/cost-repository.port.js';
import type { CostRecord, CostReportQuery } from '../domain/entities.js';

const BASE_URL = 'https://openrouter.ai';
const ACTIVITY_ENDPOINT = '/api/v1/activity';

type RawActivityItem = {
  date: string;
  model: string;
  provider_name: string;
  usage: number;
  requests: number;
  prompt_tokens: number;
  completion_tokens: number;
  reasoning_tokens: number;
};

type RawActivityResponse = {
  data: RawActivityItem[];
};

function mapToCostRecord(item: RawActivityItem): CostRecord {
  return {
    provider: 'openrouter',
    date: item.date,
    description: item.provider_name,
    model: item.model,
    amountDollars: item.usage,
    currency: 'USD',
    tokenType: null,
    costType: null,
    serviceTier: null,
  };
}

function isInRange(date: string, startingAt: string, endingAt: string) {
  return date >= startingAt && date <= endingAt;
}

export function createOpenRouterCostRepository(
  getApiKey: () => Promise<string>,
): CostRepository {
  return {
    async query(params: CostReportQuery) {
      const apiKey = await getApiKey();

      const url = `${BASE_URL}${ACTIVITY_ENDPOINT}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(
          `OpenRouter Activity API error (${res.status}): ${body || res.statusText}`,
        );
      }

      const json = (await res.json()) as RawActivityResponse;

      const startDate = params.dateRange.startingAt.slice(0, 10);
      const endDate = params.dateRange.endingAt.slice(0, 10);

      return json.data
        .filter((item) => isInRange(item.date, startDate, endDate))
        .map(mapToCostRecord);
    },
  };
}
