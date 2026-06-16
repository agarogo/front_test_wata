'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getHealth, getRuns, getRunId } from '../lib/api';
import { getCachedRunIndex, upsertCachedRuns } from '../lib/run-cache';
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
    try {
      const [healthResult, apiRuns] = await Promise.allSettled([getHealth(), getRuns()]);
      if (healthResult.status === 'fulfilled') setHealth(healthResult.value);
      
      const cached = getCachedRunIndex();
      const remoteRuns = apiRuns.status === 'fulfilled' ? apiRuns.value : [];
      
      const mergedMap = new Map<string, ReconciliationRun>();
      
      for (const run of cached) {
        const id = getRunId(run);
        if (id) mergedMap.set(id, run);
      }
      
      for (const run of remoteRuns) {
        const id = getRunId(run);
        if (id) mergedMap.set(id, run);
      }
      
      const merged = Array.from(mergedMap.values()).sort((a, b) => {
        const aTime = new Date(a.created_at || 0).getTime();
        const bTime = new Date(b.created_at || 0).getTime();
        return bTime - aTime;
      });
      
      setRuns(merged);
      upsertCachedRuns(merged);
      
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
    processing: runs.filter((r) => ['draft', 'data_loaded', 'processing', 'loaded', 'pending'].includes(String(r.status))).length,
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
        <div className="metric-card"><span>В обработке</span><strong>{stats.processing}</strong></div>
        <div className="metric-card"><span>Ошибки</span><strong>{stats.failed}</strong></div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">API</div>
            <div className="card-subtitle">{health?.version || '—'} • {health?.status || '—'}</div>
          </div>
          <button className="btn btn-secondary" onClick={load} disabled={loading}>Обновить</button>
        </div>
        {loading && runs.length === 0 ? <LoadingState label="Загрузка запусков..." /> : error ? (
          <ApiErrorAlert error={error} title="Ошибка загрузки" onRetry={load} />
        ) : runs.length ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Период</th>
                  <th>Статус</th>
                  <th>Создан</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => {
                  const id = getRunId(run);
                  return (
                    <tr key={id}>
                      <td><Link href={`/reconciliation/${id}`}>{id.length > 8 ? id.slice(0, 8) : id}</Link></td>
                      <td>{run.period_start || '—'} — {run.period_end || '—'}</td>
                      <td><StatusBadge status={run.status} /></td>
                      <td>{formatDate(run.created_at)}</td>
                      <td><Link className="btn btn-secondary" href={`/reconciliation/${id}`}>Открыть</Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="Нет запусков" description="Создайте первую сверку." />
        )}
      </div>
    </div>
  );
}
