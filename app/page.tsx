'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getHealth, getRuns, getRunId } from '../lib/api';
import type { HealthResponse, ReconciliationRun } from '../lib/types';
import ApiErrorAlert from '../components/ApiErrorAlert';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';
import StatusBadge from '../components/StatusBadge';

const LOCAL_RUNS_KEY = 'onlipay_reconciliation_runs';

function readLocalRuns(): ReconciliationRun[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(LOCAL_RUNS_KEY) || '[]') as ReconciliationRun[]; } catch { return []; }
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString('ru-RU') : '—';
}

export default function DashboardPage() {
  const [runs, setRuns] = useState<ReconciliationRun[]>([]);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [healthResult, apiRuns] = await Promise.allSettled([getHealth(), getRuns()]);
      if (healthResult.status === 'fulfilled') setHealth(healthResult.value);
      const remoteRuns = apiRuns.status === 'fulfilled' ? apiRuns.value : [];
      setRuns(remoteRuns.length ? remoteRuns : readLocalRuns());
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
    processing: runs.filter((r) => ['draft', 'data_loaded', 'processing', 'loaded'].includes(String(r.status))).length,
    failed: runs.filter((r) => String(r.status).includes('fail')).length,
  }), [runs]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Operator dashboard</div>
          <h1>OnliPay Reconciliation</h1>
          <p>Сверка WATA ↔ OnliPay: создание запуска, загрузка данных, расчёт, отчёт и принятие результата.</p>
        </div>
        <div className="actions">
          <Link className="btn" href="/reconciliation/new">Новая сверка</Link>
          <Link className="btn btn-secondary" href="/reconciliation/history">История</Link>
        </div>
      </div>

      <div className="grid-3">
        <div className="metric-card"><span>Всего запусков</span><strong>{stats.total}</strong></div>
        <div className="metric-card"><span>Завершено</span><strong>{stats.done}</strong></div>
        <div className="metric-card"><span>Ошибки</span><strong>{stats.failed}</strong></div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">API</div>
            <p>API: http://10.129.0.9:5050</p>
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
        {loading ? <LoadingState label="Загрузка запусков..." /> : runs.length === 0 ? (
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
