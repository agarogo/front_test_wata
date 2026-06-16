'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getTables } from '../../../../lib/api';
import ApiErrorAlert from '../../../../components/ApiErrorAlert';
import DataTable from '../../../../components/DataTable';
import EmptyState from '../../../../components/EmptyState';
import LoadingState from '../../../../components/LoadingState';

const tableNames = [
  'wata_payments',
  'onlipay_payments',
  'carry_over_payments',
  'carry_over_payments_pending',
  'gateway_missing_in_wata_current',
  'gateway_missing_in_wata_resolved',
  'wata_missing_in_gateway_current',
  'wata_missing_in_gateway_resolved',
  'amount_commission_discrepancies',
  'db_counts',
];

function rowsFromValue(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.map((row) => row && typeof row === 'object' ? row as Record<string, unknown> : { value: row });
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const nestedArrays = Object.entries(record).filter(([, nested]) => Array.isArray(nested));
    if (nestedArrays.length) {
      return nestedArrays.flatMap(([group, nested]) => (nested as unknown[]).map((row) => ({ group, ...(row && typeof row === 'object' ? row as Record<string, unknown> : { value: row }) })));
    }
    return Object.entries(record).map(([key, val]) => ({ key, value: val }));
  }
  return [];
}

export default function TablesPage({ params }: { params: { run_id: string } }) {
  const runId = decodeURIComponent(params.run_id);
  const [tables, setTables] = useState<Record<string, unknown>>({});
  const [active, setActive] = useState(tableNames[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTables(await getTables(runId));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const availableNames = useMemo(() => {
    const fromApi = Object.keys(tables).filter((key) => key !== 'run_id');
    return Array.from(new Set([...tableNames, ...fromApi]));
  }, [tables]);

  const rows = useMemo(() => rowsFromValue(tables[active]), [tables, active]);
  const columns = useMemo(() => {
    const first = rows[0] || {};
    const keys = Object.keys(first).slice(0, 10);
    return (keys.length ? keys : ['key', 'value']).map((key) => ({ key, header: key }));
  }, [rows]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Промежуточные таблицы</div>
          <h1>Запуск {runId.slice(0, 8)}</h1>
          <p>Данные загрузки, переносы и расхождения по запуску.</p>
        </div>
        <Link className="btn btn-secondary" href={`/reconciliation/${runId}`}>К запуску</Link>
      </div>

      {loading ? <LoadingState label="Загрузка таблиц..." /> : error ? <ApiErrorAlert error={error} title="Ошибка загрузки таблиц" onRetry={load} /> : (
        <div className="card">
          <div className="actions">{availableNames.map((name) => <button key={name} className={active === name ? 'btn' : 'btn btn-secondary'} onClick={() => setActive(name)}>{name}</button>)}</div>
          {rows.length ? <DataTable rows={rows} columns={columns} /> : <EmptyState title="Таблицы пока пустые" description={active} />}
        </div>
      )}
    </div>
  );
}
