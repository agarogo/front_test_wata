'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { getReport } from '../../../../lib/api';
import type { FinancialReport } from '../../../../lib/types';
import ApiErrorAlert from '../../../../components/ApiErrorAlert';
import LoadingState from '../../../../components/LoadingState';
import MoneyValue from '../../../../components/MoneyValue';

function Row({ label, value, usdt = false }: { label: string; value: unknown; usdt?: boolean }) {
  return <tr><td>{label}</td><td>{typeof value === 'number' || typeof value === 'string' ? <MoneyValue value={value} currency={usdt ? 'USDT' : 'RUB'} /> : '—'}</td></tr>;
}

export default function ReportPage({ params }: { params: { run_id: string } }) {
  const runId = decodeURIComponent(params.run_id);
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setReport(await getReport(runId)); } catch (err) { setError(err); } finally { setLoading(false); }
  }, [runId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return (
    <div className="page">
      <div className="page-header"><div><div className="page-eyebrow">Отчёт</div><h1>Финансовый отчёт</h1><p>Отчёт доступен после успешного расчёта сверки.</p></div><Link className="btn btn-secondary" href={`/reconciliation/${runId}`}>К запуску</Link></div>
      {loading ? <LoadingState label="Загрузка отчёта..." /> : error ? <ApiErrorAlert error={error} title="Отчёт пока недоступен" onRetry={load} /> : (
        <div className="card"><div className="card-header"><div className="card-title">Итоги</div></div><div className="table-container"><table><tbody>
          <Row label="amount_8_1" value={report?.amount_8_1} />
          <Row label="Gateway missing in WATA" value={report?.gateway_missing_in_wata_current ?? report?.gateway_missing_in_wata_current_total} />
          <Row label="WATA missing in gateway" value={report?.wata_missing_in_gateway_current ?? report?.wata_missing_in_gateway_current_total} />
          <Row label="Amount/commission discrepancies" value={report?.amount_commission_discrepancies_total} />
          <Row label="Preliminary RUB" value={report?.preliminary_rub_amount} />
          <Row label="Final RUB" value={report?.final_rub_amount} />
          <Row label="Calculated USDT" value={report?.calculated_usdt_amount} usdt />
          <Row label="Gateway USDT" value={report?.gateway_usdt_amount} usdt />
          <Row label="USDT difference" value={report?.usdt_difference} usdt />
        </tbody></table></div></div>
      )}
    </div>
  );
}
