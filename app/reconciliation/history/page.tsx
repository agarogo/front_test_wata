'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getRuns } from '../../../lib/api';
import { getCachedRunIndex, getRunId, mergeCachedAndRemoteRuns } from '../../../lib/run-cache';
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
  const [manualId, setManualId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const cached = getCachedRunIndex();
    setRuns(cached);
    try {
      const remote = await getRuns();
      setRuns(mergeCachedAndRemoteRuns(remote, cached));
    } catch (err) {
      setError(err);
      setRuns(cached);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function openManualRun() {
    const id = manualId.trim();
    if (id) router.push(`/reconciliation/${encodeURIComponent(id)}`);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div><div className="page-eyebrow">История</div><h1>Запуски сверки</h1><p>Список запусков из кеша браузера и backend, если список доступен.</p></div>
        <Link className="btn" href="/reconciliation/new">Новая сверка</Link>
      </div>
      {error && runs.length === 0 ? <ApiErrorAlert error={error} title="API истории недоступен" onRetry={load} /> : null}

      <div className="card">
        <div className="card-header"><div className="card-title">Открыть по ID</div></div>
        <div className="actions">
          <input style={{ maxWidth: 360 }} placeholder="ID запуска" value={manualId} onChange={(event) => setManualId(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') openManualRun(); }} />
          <button className="btn" type="button" onClick={openManualRun}>Открыть</button>
          <button className="btn btn-secondary" type="button" onClick={load}>Обновить</button>
        </div>
      </div>

      <div className="card">
        {loading && runs.length === 0 ? <LoadingState label="Загрузка истории..." /> : runs.length === 0 ? (
          <EmptyState title="История пустая" description="Создай первый запуск или открой существующий запуск по ID." action={<Link className="btn" href="/reconciliation/new">Создать</Link>} />
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
