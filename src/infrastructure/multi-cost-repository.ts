import type { CostRepository } from '../domain/cost-repository.port.js';

export function createMultiCostRepository(
  repositories: CostRepository[],
): CostRepository {
  return {
    async query(params) {
      const results = await Promise.all(
        repositories.map((r) => r.query(params)),
      );
      return results.flat().sort((a, b) => a.date.localeCompare(b.date));
    },
  };
}
