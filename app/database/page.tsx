'use client';

import { useCallback, useEffect, useState } from 'react';
import { getDbCounts } from '../../lib/api';
import ApiErrorAlert from '../../components/ApiErrorAlert';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';

type Counts = Record<string, number>;

const labels: Record<string, string> = {
  reconciliation_runs: 'reconciliation_runs',
  wata_transactions: 'wata_transactions',
  onlipay_transactions: 'onlipay_transactions',
  run_items: 'run_items',
};

export default function DatabasePage() {
  const [counts, setCounts] = useState<Counts>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCounts(await getDbCounts());
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const keys = Object.keys(counts).length ? Object.keys(counts) : Object.keys(labels);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Database</div>
          <h1>Проверка БД</h1>
          <p>Количество сохранённых записей в таблицах backend.</p>
        </div>
        <button className="btn btn-primary" onClick={load}>Обновить</button>
      </div>

      {error ? <ApiErrorAlert error={error} title="Ошибка загрузки DB counts" onRetry={load} /> : null}
      {loading ? <LoadingState label="Загрузка DB counts..." /> : Object.keys(counts).length === 0 ? <EmptyState title="Данные БД не получены" /> : (
        <div className="grid-3">
          {keys.map((key) => <div className="metric-card" key={key}><span>{labels[key] || key}</span><strong>{counts[key] ?? '—'}</strong></div>)}
        </div>
      )}
    </div>
  );
}
