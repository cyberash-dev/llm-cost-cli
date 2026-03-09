import type { UsageRepository } from '../domain/usage-repository.port.js';

export function createMultiUsageRepository(
  repositories: UsageRepository[],
): UsageRepository {
  return {
    async query(params) {
      const results = await Promise.all(
        repositories.map((r) => r.query(params)),
      );
      return results.flat().sort((a, b) => a.date.localeCompare(b.date));
    },
  };
}
