import type { DateRange, Provider } from '../domain/entities.js';

const ADMIN_KEY_PREFIXES: Record<Provider, string[]> = {
  anthropic: ['sk-ant-admin'],
  openai: ['sk-admin-', 'sk-proj-', 'sk-svcacct-'],
  openrouter: ['sk-or-'],
};

export function parseDateRange(
  period?: string,
  from?: string,
  to?: string,
): DateRange {
  const now = new Date();
  let startingAt: Date;
  let endingAt: Date;

  if (from && to) {
    startingAt = new Date(from);
    endingAt = new Date(to);
  } else if (period) {
    const days = parsePeriod(period);
    endingAt = now;
    startingAt = new Date(now);
    startingAt.setDate(startingAt.getDate() - days);
  } else {
    endingAt = now;
    startingAt = new Date(now);
    startingAt.setDate(startingAt.getDate() - 7);
  }

  return {
    startingAt: startingAt.toISOString(),
    endingAt: endingAt.toISOString(),
  };
}

function parsePeriod(period: string): number {
  const match = period.match(/^(\d+)(d|days?)$/i);
  if (!match) return 7;
  const value = parseInt(match[1], 10);
  return Number.isNaN(value) ? 7 : value;
}

export function isValidAdminKeyForProvider(
  key: string,
  provider: Provider,
): boolean {
  return ADMIN_KEY_PREFIXES[provider].some((prefix) => key.startsWith(prefix));
}

export function maskApiKey(key: string): string {
  if (key.length <= 19) return '***';
  return `${key.slice(0, 15)}...${key.slice(-4)}`;
}
