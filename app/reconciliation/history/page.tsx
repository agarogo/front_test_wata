'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { getRuns, getRunId } from '../../../lib/api';
import type { ReconciliationRun } from '../../../lib/types';
import ApiErrorAlert from '../../../components/ApiErrorAlert';
import EmptyState from '../../../components/EmptyState';
import LoadingState from '../../../components/LoadingState';
import StatusBadge from '../../../components/StatusBadge';

const LOCAL_RUNS_KEY = 'onlipay_reconciliation_runs';

function readLocalRuns(): ReconciliationRun[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_RUNS_KEY) || '[]') as ReconciliationRun[]; } catch { return []; }
}

export default function HistoryPage() {
  const [runs, setRuns] = useState<ReconciliationRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const remote = await getRuns();
      setRuns(remote.length ? remote : readLocalRuns());
    } catch (err) {
      setError(err);
      setRuns(readLocalRuns());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return (
    <div className="page">
      <div className="page-header">
        <div><div className="page-eyebrow">История</div><h1>Запуски сверки</h1><p>Список созданных запусков и быстрые действия.</p></div>
        <Link className="btn" href="/reconciliation/new">Новая сверка</Link>
      </div>
      {error ? <ApiErrorAlert error={error} title="API истории недоступен" onRetry={load} /> : null}
      <div className="card">
        {loading ? <LoadingState label="Загрузка истории..." /> : runs.length === 0 ? (
          <EmptyState title="История пустая" description="Создай первый запуск сверки." action={<Link className="btn" href="/reconciliation/new">Создать</Link>} />
        ) : (
          <div className="table-container">
            <table>
              <thead><tr><th>ID</th><th>Статус</th><th>Период</th><th>Создан</th><th>Действия</th></tr></thead>
              <tbody>
                {runs.map((run) => {
                  const id = getRunId(run);
                  return <tr key={id}>
                    <td className="key-field">{id || '—'}</td>
                    <td><StatusBadge status={run.status} /></td>
                    <td>{run.period_start || '—'} — {run.period_end || '—'}</td>
                    <td>{run.created_at ? new Date(run.created_at).toLocaleString('ru-RU') : '—'}</td>
                    <td className="actions">
                      <Link className="btn btn-secondary" href={`/reconciliation/${id}`}>Открыть</Link>
                      <Link className="btn btn-ghost" href={`/reconciliation/${id}/report`}>Отчёт</Link>
                      <Link className="btn btn-ghost" href={`/reconciliation/${id}/tables`}>Таблицы</Link>
                    </td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
