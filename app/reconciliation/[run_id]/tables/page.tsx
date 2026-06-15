'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getTables } from '../../../../lib/api';
import ApiErrorAlert from '../../../../components/ApiErrorAlert';
import DataTable from '../../../../components/DataTable';
import EmptyState from '../../../../components/EmptyState';
import LoadingState from '../../../../components/LoadingState';

const tableNames = [
  'carry_over_payments_pending',
  'gateway_missing_in_wata_current',
  'gateway_missing_in_wata_resolved',
  'wata_missing_in_gateway_current',
  'wata_missing_in_gateway_resolved',
  'amount_commission_discrepancies',
  'carry_over_payments',
  'mismatch_gateway_not_found',
  'mismatch_wata_not_found',
  'gateway_refunds',
];

export default function TablesPage({ params }: { params: { run_id: string } }) {
  const runId = decodeURIComponent(params.run_id);
  const [tables, setTables] = useState<Record<string, unknown[]>>({});
  const [active, setActive] = useState(tableNames[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setTables(await getTables(runId)); } catch (err) { setError(err); } finally { setLoading(false); }
  }, [runId]);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const rows = useMemo(() => (tables[active] || []) as Record<string, unknown>[], [tables, active]);
  const columns = useMemo(() => {
    const first = rows[0] || {};
    const keys = Object.keys(first).slice(0, 8);
    return (keys.length ? keys : ['transaction_id', 'amount', 'status']).map((key) => ({ key, header: key }));
  }, [rows]);

  return (
    <div className="page">
      <div className="page-header"><div><div className="page-eyebrow">Промежуточные таблицы</div><h1>Запуск {runId.slice(0, 8)}</h1><p>Таблицы и расхождения по запуску.</p></div><Link className="btn btn-secondary" href={`/reconciliation/${runId}`}>К запуску</Link></div>
      {loading ? <LoadingState label="Загрузка таблиц..." /> : error ? <ApiErrorAlert error={error} title="Tables API is not implemented yet" onRetry={load} /> : (
        <div className="card">
          <div className="actions">{tableNames.map((name) => <button key={name} className={active === name ? 'btn' : 'btn btn-secondary'} onClick={() => setActive(name)}>{name}</button>)}</div>
          {rows.length ? <DataTable rows={rows} columns={columns} /> : <EmptyState title="Таблица пустая" description={active} />}
        </div>
      )}
    </div>
  );
}
