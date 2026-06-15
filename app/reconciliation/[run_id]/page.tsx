'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { acceptRun, calculateRun, getRun, getRunCounts } from '../../../lib/api';
import type { ReconciliationRun, RunCounts } from '../../../lib/types';
import ApiErrorAlert from '../../../components/ApiErrorAlert';
import LoadingState from '../../../components/LoadingState';
import ReconciliationSummaryCards from '../../../components/ReconciliationSummaryCards';

export default function RunDetailPage({ params }: { params: { run_id: string } }) {
  const runId = decodeURIComponent(params.run_id);
  const [run, setRun] = useState<ReconciliationRun | null>(null);
  const [counts, setCounts] = useState<RunCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [runResult, countsResult] = await Promise.allSettled([getRun(runId), getRunCounts(runId)]);
      if (runResult.status === 'fulfilled') setRun(runResult.value);
      else throw runResult.reason;
      if (countsResult.status === 'fulfilled') setCounts(countsResult.value);
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

  async function handleCalculate() {
    setActionLoading(true);
    setMessage(null);
    try {
      await calculateRun(runId);
      setMessage('Расчёт выполнен');
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAccept() {
    setActionLoading(true);
    setMessage(null);
    try {
      await acceptRun(runId);
      setMessage('Результат принят');
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return <LoadingState label="Загрузка запуска..." />;

  return (
    <div className="page">
      <div className="page-header">
        <div><div className="page-eyebrow">Запуск</div><h1>Сверка {runId.slice(0, 8)}</h1><p>Детали запуска и основные действия.</p></div>
        <div className="actions"><Link className="btn btn-secondary" href="/reconciliation/history">История</Link><Link className="btn" href={`/reconciliation/${runId}/upload`}>Загрузка данных</Link></div>
      </div>
      {error ? <ApiErrorAlert error={error} title="Ошибка запуска" onRetry={load} /> : null}
      {message && <div className="alert"><strong>{message}</strong></div>}
      <ReconciliationSummaryCards run={run} counts={counts} />
      <div className="card">
        <div className="card-header"><div className="card-title">Действия</div></div>
        <div className="actions">
          <button className="btn" onClick={handleCalculate} disabled={actionLoading}>Запустить расчёт</button>
          <button className="btn btn-secondary" onClick={handleAccept} disabled={actionLoading}>Принять сверку</button>
          <Link className="btn btn-secondary" href={`/reconciliation/${runId}/report`}>Открыть отчёт</Link>
          <Link className="btn btn-secondary" href={`/reconciliation/${runId}/tables`}>Промежуточные таблицы</Link>
        </div>
      </div>
    </div>
  );
}
