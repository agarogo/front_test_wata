import type { ReconciliationRun, RunCounts } from '../lib/types';
import MoneyValue from './MoneyValue';
import StatusBadge from './StatusBadge';

function valueOrDash(value: unknown) {
  return value === undefined || value === null || value === '' ? '—' : String(value);
}

export default function ReconciliationSummaryCards({ run, counts }: { run?: ReconciliationRun | null; counts?: RunCounts | null }) {
  return (
    <div className="summary-grid">
      <div className="metric-card">
        <span>Статус</span>
        <strong><StatusBadge status={run?.status} /></strong>
      </div>
      <div className="metric-card">
        <span>Период</span>
        <strong>{valueOrDash(run?.period_start)} — {valueOrDash(run?.period_end)}</strong>
      </div>
      <div className="metric-card">
        <span>Совпадения</span>
        <strong>{valueOrDash(counts?.matched ?? counts?.matched_count)}</strong>
      </div>
      <div className="metric-card">
        <span>Расхождения</span>
        <strong>{valueOrDash(counts?.discrepancies_count)}</strong>
      </div>
      <div className="metric-card">
        <span>Итог RUB</span>
        <strong><MoneyValue value={run?.final_rub_amount ?? run?.gateway_final_rub_amount} /></strong>
      </div>
      <div className="metric-card">
        <span>Разница USDT</span>
        <strong><MoneyValue value={run?.usdt_difference} currency="USDT" /></strong>
      </div>
    </div>
  );
}
