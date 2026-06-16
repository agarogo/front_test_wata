'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getHealth, getRuns } from '../lib/api';
import { getCachedRunIndex, getRunId, mergeCachedAndRemoteRuns } from '../lib/run-cache';
import type { HealthResponse, ReconciliationRun } from '../lib/types';
import ApiErrorAlert from '../components/ApiErrorAlert';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';
import StatusBadge from '../components/StatusBadge';

function formatDate(value?: string) {
  if (!value) return '—';
  return value.replace('T', ' ').slice(0, 16);
}

export default function DashboardPage() {
  const [runs, setRuns] = useState<ReconciliationRun[]>([]);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const cached = getCachedRunIndex();
    setRuns(cached);
    try {
      const [healthResult, apiRuns] = await Promise.allSettled([getHealth(), getRuns()]);
      if (healthResult.status === 'fulfilled') setHealth(healthResult.value);
      const remoteRuns = apiRuns.status === 'fulfilled' ? apiRuns.value : [];
      setRuns(mergeCachedAndRemoteRuns(remoteRuns, cached));
      if (healthResult.status === 'rejected') setError(healthResult.reason);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const stats = useMemo(() => ({
    total: runs.length,
    done: runs.filter((r) => ['accepted', 'calculated', 'completed'].includes(String(r.status))).length,
    processing: runs.filter((r) => ['pending', 'draft', 'data_loaded', 'processing', 'loaded'].includes(String(r.status))).length,
    failed: runs.filter((r) => String(r.status).includes('fail')).length,
  }), [runs]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Operator dashboard</div>
          <h1>OnliPay/WATA Reconciliation</h1>
          <p>Загрузка Excel, расчёт сверки из БД, отчёты и промежуточные таблицы.</p>
        </div>
        <div className="actions">
          <Link className="btn" href="/reconciliation/new">Новая сверка</Link>
          <Link className="btn btn-secondary" href="/reconciliation/history">История/проверка БД</Link>
          <Link className="btn btn-secondary" href="/database">БД</Link>
        </div>
      </div>

      <div className="grid-3">
        <div className="metric-card"><span>Всего запусков</span><strong>{stats.total}</strong></div>
        <div className="metric-card"><span>Завершено</span><strong>{stats.done}</strong></div>
        <div className="metric-card"><span>В обработке</span><strong>{stats.processing}</strong></div>
        <div className="metric-card"><span>Ошибки</span><strong>{stats.failed}</strong></div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Backend status</div>
            <p>{health?.status === 'healthy' ? 'Backend online' : 'Backend unavailable. Check server or NEXT_PUBLIC_API_BASE_URL.'}</p>
          </div>
          <StatusBadge status={health?.status === 'healthy' ? 'completed' : 'failed'} />
        </div>
        {error ? <ApiErrorAlert error={error} title="API недоступен" onRetry={load} /> : null}
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Последние запуски</div>
          <Link className="btn btn-secondary" href="/reconciliation/history">Открыть историю</Link>
        </div>
        {loading && runs.length === 0 ? <LoadingState label="Загрузка запусков..." /> : runs.length === 0 ? (
          <EmptyState title="Пока нет запусков" description="Создай новую сверку, после этого запуск появится в списке." action={<Link className="btn" href="/reconciliation/new">Создать сверку</Link>} />
        ) : (
          <div className="table-container">
            <table>
              <thead><tr><th>ID</th><th>Статус</th><th>Период</th><th>Создан</th><th>Действия</th></tr></thead>
              <tbody>
                {runs.slice(0, 6).map((run) => {
                  const id = getRunId(run);
                  return <tr key={id}>
                    <td className="key-field">{id.slice(0, 8)}</td>
                    <td><StatusBadge status={run.status} /></td>
                    <td>{run.period_start || '—'} — {run.period_end || '—'}</td>
                    <td>{formatDate(run.created_at)}</td>
                    <td><Link className="btn btn-secondary" href={`/reconciliation/${id}`}>Открыть</Link></td>
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
