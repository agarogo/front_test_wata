'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getRuns, getRunId } from '../../../lib/api';
import { getCachedRunIndex, upsertCachedRuns } from '../../../lib/run-cache';
import type { ReconciliationRun } from '../../../lib/types';
import ApiErrorAlert from '../../../components/ApiErrorAlert';
import EmptyState from '../../../components/EmptyState';
import LoadingState from '../../../components/LoadingState';
import StatusBadge from '../../../components/StatusBadge';

function formatDate(value?: string) {
  if (!value) return '—';
  return value.replace('T', ' ').slice(0, 16);
}

export default function HistoryPage() {
  const router = useRouter();
  const [runs, setRuns] = useState<ReconciliationRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [runIdInput, setRunIdInput] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cached = getCachedRunIndex();
      setRuns(cached);
      
      const remote = await getRuns();
      
      const mergedMap = new Map<string, ReconciliationRun>();
      
      for (const run of cached) {
        const id = getRunId(run);
        if (id) mergedMap.set(id, run);
      }
      
      for (const run of remote) {
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
    } catch (err) {
      setError(err);
      const cached = getCachedRunIndex();
      setRuns(cached);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function handleOpenRun() {
    const id = runIdInput.trim();
    if (id) {
      router.push(`/reconciliation/${encodeURIComponent(id)}`);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div><div className="page-eyebrow">История</div><h1>Запуски сверки</h1><p>Список созданных запусков и быстрые действия.</p></div>
        <Link className="btn" href="/reconciliation/new">Новая сверка</Link>
      </div>
      {error ? <ApiErrorAlert error={error} title="API истории недоступен" onRetry={load} /> : null}
      <div className="card">
        <div className="form-field" style={{ marginBottom: '1rem' }}>
          <label>ID запуска</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              value={runIdInput} 
              onChange={(e) => setRunIdInput(e.target.value)}
              placeholder="Введите ID запуска"
              style={{ flex: 1 }}
            />
            <button className="btn btn-secondary" onClick={handleOpenRun}>Открыть</button>
          </div>
        </div>
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
                    <td>{formatDate(run.created_at)}</td>
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
