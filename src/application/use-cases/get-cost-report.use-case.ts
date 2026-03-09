import type { CostRepository } from '../../domain/cost-repository.port.js';
import type { CostReportQuery } from '../../domain/entities.js';
import { parseDateRange } from '../date-range.helper.js';
import type { CostPresenter } from '../ports/cost-presenter.port.js';

type GetCostReportParams = {
  period?: string;
  from?: string;
  to?: string;
  groupBy?: string[];
  sumOnly?: boolean;
};

export function createGetCostReportUseCase(
  costRepository: CostRepository,
  costPresenter: CostPresenter,
): (params: GetCostReportParams) => Promise<void> {
  return async (params) => {
    const dateRange = parseDateRange(params.period, params.from, params.to);
    const query: CostReportQuery = {
      dateRange,
      groupBy: params.groupBy,
    };
    const records = await costRepository.query(query);
    if (params.sumOnly) {
      const total = records.reduce((acc, r) => acc + r.amountDollars, 0);
      const currency = records[0]?.currency ?? 'USD';
      costPresenter.presentSum(total, currency);
    } else {
      costPresenter.present(records);
    }
  };
}
