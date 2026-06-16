'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { acceptRun, calculateRun, getReportTxtUrl, getReportXlsxUrl, getRun, getRunCounts } from '../../../lib/api';
import { getCachedRunDetail, setCachedRunDetail, upsertCachedRun } from '../../../lib/run-cache';
import type { ReconciliationRun, RunCounts } from '../../../lib/types';
import ApiErrorAlert from '../../../components/ApiErrorAlert';
import LoadingState from '../../../components/LoadingState';
import ReconciliationSummaryCards from '../../../components/ReconciliationSummaryCards';
import StatusBadge from '../../../components/StatusBadge';

function formatDate(value?: string) {
  if (!value) return '—';
  return value.replace('T', ' ').slice(0, 16);
}

export default function RunDetailPage({ params }: { params: Promise<{ run_id: string }> }) {
  const { run_id } = use(params);
  const runId = decodeURIComponent(run_id);
  const [run, setRun] = useState<ReconciliationRun | null>(null);
  const [counts, setCounts] = useState<RunCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showCachedWarning, setShowCachedWarning] = useState(false);

  const status = String(run?.status || 'draft');
  const canCalculate = ['draft', 'data_loaded', 'loaded', 'failed'].includes(status);
  const canAccept = status === 'calculated';

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setShowCachedWarning(false);
    
    const cached = getCachedRunDetail(runId);
    if (cached) {
      setRun(cached);
    }
    
    try {
      const [runResult, countsResult] = await Promise.allSettled([getRun(runId), getRunCounts(runId)]);
      
      if (runResult.status === 'fulfilled') {
        const freshRun = runResult.value;
        setRun(freshRun);
        setCachedRunDetail(runId, freshRun);
        upsertCachedRun(freshRun);
      } else {
        if (cached) {
          setShowCachedWarning(true);
        } else {
          throw runResult.reason;
        }
      }
      
      if (countsResult.status === 'fulfilled') {
        setCounts(countsResult.value);
      }
    } catch (err) {
      if (!cached) {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function handleRefresh() {
    await load();
  }

  async function handleCalculate() {
    setActionLoading(true);
    setMessage(null);
    setError(null);
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
    setError(null);
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

  const metaRows = useMemo(() => ([
    ['ID', runId],
    ['Статус', run?.status || '—'],
    ['Период', `${run?.period_start || '—'} — ${run?.period_end || '—'}`],
    ['Создан', formatDate(run?.created_at)],
    ['Обновлён', formatDate(run?.updated_at)],
  ]), [run, runId]);

  if (loading && !run) return <LoadingState label="Загрузка запуска..." />;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Запуск</div>
          <h1>Сверка {runId.length > 8 ? runId.slice(0, 8) : runId}</h1>
          <p>Детали запуска, загрузка данных, расчёт, отчёты и принятие результата.</p>
        </div>
        <div className="actions">
          <button className="btn btn-secondary" onClick={handleRefresh} disabled={loading}>Обновить</button>
          <Link className="btn btn-secondary" href="/reconciliation/history">История</Link>
          <Link className="btn" href={`/reconciliation/${runId}/upload`}>Загрузка данных</Link>
        </div>
      </div>

      {error ? <ApiErrorAlert error={error} title="Ошибка запуска" onRetry={load} /> : null}
      {showCachedWarning && <div className="alert"><strong>Показаны сохранённые данные</strong></div>}
      {message && <div className="alert"><strong>{message}</strong></div>}

      <ReconciliationSummaryCards run={run} counts={counts} />

      <div className="grid-2">
        <div className="card">
          <div className="card-header"><div className="card-title">Информация</div><StatusBadge status={run?.status} /></div>
          <div className="table-container">
            <table>
              <tbody>{metaRows.map(([label, value]) => <tr key={label}><td>{label}</td><td>{value}</td></tr>)}</tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">Действия</div></div>
          <div className="actions">
            {canCalculate ? <button className="btn" onClick={handleCalculate} disabled={actionLoading}>Запустить расчёт</button> : null}
            {canAccept ? <button className="btn btn-secondary" onClick={handleAccept} disabled={actionLoading}>Принять сверку</button> : null}
            {status === 'accepted' ? <span className="badge badge-success">Принято</span> : null}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Отчёты</div></div>
        <div className="actions">
          <a className="btn" href={getReportXlsxUrl(runId)}>Скачать XLSX</a>
          <a className="btn btn-secondary" href={getReportTxtUrl(runId)}>Скачать TXT</a>
          <Link className="btn btn-secondary" href={`/reconciliation/${runId}/report`}>Открыть отчёт</Link>
          <Link className="btn btn-secondary" href={`/reconciliation/${runId}/tables`}>Таблицы</Link>
        </div>
      </div>
    </div>
  );
}
