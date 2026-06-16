'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getTables } from '../../../../lib/api';
import { getCachedTables, setCachedTables } from '../../../../lib/run-cache';
import type { ReconciliationTables } from '../../../../lib/types';
import ApiErrorAlert from '../../../../components/ApiErrorAlert';
import DataTable from '../../../../components/DataTable';
import EmptyState from '../../../../components/EmptyState';
import LoadingState from '../../../../components/LoadingState';

const tableLabels: Record<string, string> = {
  wata_payments: 'WATA payments',
  carry_over_payments: 'Carry-over payments',
  onlipay_payments: 'OnliPay payments',
  carry_over_payments_pending: 'Carry-over pending',
  gateway_missing_in_wata_current: 'Gateway missing in WATA',
  gateway_missing_in_wata_resolved: 'Gateway missing in WATA resolved',
  wata_missing_in_gateway_current: 'WATA missing in gateway',
  wata_missing_in_gateway_resolved: 'WATA missing in gateway resolved',
  amount_commission_discrepancies: 'Amount/commission discrepancies',
  db_counts: 'DB counts',
};

const orderedTables = Object.keys(tableLabels);

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

export default function TablesPage({ params }: { params: Promise<{ run_id: string }> }) {
  const { run_id } = use(params);
  const runId = decodeURIComponent(run_id);
  const [tables, setTables] = useState<ReconciliationTables>({});
  const [active, setActive] = useState(orderedTables[0]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    else setRefreshing(true);
    setError(null);
    const cached = getCachedTables(runId);
    if (cached) {
      setTables(cached);
      setLoading(false);
    }
    try {
      const fresh = await getTables(runId);
      setTables(fresh);
      setCachedTables(runId, fresh);
    } catch (err) {
      if (!cached) setError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [runId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const availableNames = useMemo(() => {
    const fromApi = Object.keys(tables).filter((key) => key !== 'run_id');
    return Array.from(new Set([...orderedTables, ...fromApi]));
  }, [tables]);

  const rows = useMemo(() => rowsFromValue(tables[active]), [tables, active]);
  const columns = useMemo(() => {
    const preferred = ['transaction_id', 'terminal_operation_number', 'payment_id', 'server_time', 'transaction_datetime', 'status', 'substatus', 'transaction_amount', 'accepted_amount', 'gateway_commission_amount', 'discrepancy_effect'];
    const allKeys = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
    const ordered = [...preferred.filter((key) => allKeys.includes(key)), ...allKeys.filter((key) => !preferred.includes(key))].slice(0, 12);
    return (ordered.length ? ordered : ['key', 'value']).map((key) => ({ key, header: key }));
  }, [rows]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Промежуточные таблицы</div>
          <h1>Запуск {runId.slice(0, 8)}</h1>
          <p>Главная связка сверки: WATA transaction_id = OnliPay terminal_operation_number.</p>
        </div>
        <div className="actions">
          <button className="btn btn-secondary" onClick={() => void load(false)} disabled={refreshing}>{refreshing ? 'Обновляю...' : 'Обновить таблицы'}</button>
          <Link className="btn btn-secondary" href={`/reconciliation/${runId}`}>К запуску</Link>
        </div>
      </div>

      {loading && !Object.keys(tables).length ? <LoadingState label="Загрузка таблиц..." /> : error ? <ApiErrorAlert error={error} title="Ошибка загрузки таблиц" onRetry={() => load(false)} /> : (
        <div className="card">
          <div className="actions">{availableNames.map((name) => <button key={name} className={active === name ? 'btn btn-primary' : 'btn btn-primary'} onClick={() => setActive(name)}>{tableLabels[name] || name}</button>)}</div>
          {rows.length ? <DataTable rows={rows} columns={columns} emptyTitle="Таблицы пока пустые" /> : <EmptyState title="Таблицы пока пустые" description={tableLabels[active] || active} />}
        </div>
      )}
    </div>
  );
}
