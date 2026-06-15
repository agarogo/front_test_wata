"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getRun, getRunCounts, acceptRun, deleteRun, getReportXlsxUrl, getReportTxtUrl } from '../../../lib/api';
import { RunDetail, RunCounts } from '../../../lib/types';
import ApiErrorAlert from '../../../components/ApiErrorAlert';
import LoadingState from '../../../components/LoadingState';
import EmptyState from '../../../components/EmptyState';
import ReconciliationSummaryCards from '../../../components/ReconciliationSummaryCards';

function getRunId(run: RunDetail): string {
  return String(run.id ?? "");
}

function getShortRunId(run: RunDetail): string {
  const id = getRunId(run);
  return id ? id.slice(0, 8) : "—";
}

export default function RunDetailPage() {
  const params = useParams();
  const router = useRouter();
  const runId = params.run_id as string;

  const [run, setRun] = useState<RunDetail | null>(null);
  const [counts, setCounts] = useState<RunCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadRun = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [runResult, countsResult] = await Promise.all([
        getRun(runId),
        getRunCounts(runId).catch(() => null)
      ]);
      setRun((runResult as RunDetail) || null);
      setCounts((countsResult as RunCounts) || null);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Ошибка загрузки запуска');
      setRun(null);
      setCounts(null);
    } finally {
      setLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadRun();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadRun]);

  async function handleAccept() {
    if (!run) return;

    if (!confirm(`Подтвердить запуск ${getShortRunId(run)}...?`)) {
      return;
    }

    setActionLoading(true);
    try {
      await acceptRun(runId);
      await loadRun();
    } catch (err: unknown) {
      const error = err as { message?: string };
      alert(error.message || 'Ошибка при подтверждении');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!run) return;

    if (!confirm(`Удалить запуск ${getShortRunId(run)}...? Это действие нельзя отменить.`)) {
      return;
    }

    setActionLoading(true);
    try {
      await deleteRun(runId);
      router.push('/reconciliation/history');
    } catch (err: unknown) {
      const error = err as { message?: string };
      alert(error.message || 'Ошибка при удалении');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="page-header">
          <h1>Запуск сверки: {runId}</h1>
          <Link href="/reconciliation/history" className="secondary">← К списку запусков</Link>
        </div>
        <LoadingState label="Загрузка данных запуска..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="page-header">
          <h1>Запуск сверки: {runId}</h1>
          <Link href="/reconciliation/history" className="secondary">← К списку запусков</Link>
        </div>
        <ApiErrorAlert error={error} title="Ошибка загрузки" onRetry={loadRun} />
      </div>
    );
  }

  if (!run) {
    return (
      <div className="container">
        <div className="page-header">
          <h1>Запуск сверки: {runId}</h1>
          <Link href="/reconciliation/history" className="secondary">← К списку запусков</Link>
        </div>
        <EmptyState
          title="Запуск не найден"
          description="Запуск с таким ID не существует или был удален"
          action={
            <Link href="/reconciliation/history" className="primary">
              Вернуться к списку
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Запуск сверки: {getShortRunId(run)}...</h1>
        <Link href="/reconciliation/history" className="secondary">← К списку запусков</Link>
      </div>

      <ReconciliationSummaryCards run={run} counts={counts} />

      {/* Actions */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Действия</div>
        </div>
        <div className="actions">
          {run.status === 'completed' && (
            <button onClick={handleAccept} disabled={actionLoading} className="primary">
              {actionLoading ? 'Обработка...' : 'Подтвердить'}
            </button>
          )}
          {run.status !== 'accepted' && (
            <button onClick={handleDelete} disabled={actionLoading} className="danger">
              {actionLoading ? 'Обработка...' : 'Удалить'}
            </button>
          )}
          <a href={getReportXlsxUrl(runId)} className="secondary" download>
            Скачать Excel
          </a>
          <a href={getReportTxtUrl(runId)} className="secondary" download>
            Скачать TXT
          </a>
        </div>
      </div>

      {/* Retry Button */}
      <div className="card">
        <button onClick={loadRun} className="secondary">
          Повторить загрузку
        </button>
      </div>

      {/* Debug Block */}
      <div className="card" style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
        <div className="card-title">Debug Info</div>
        <div>API: http://10.129.0.9:8055</div>
        <div>Hydrated: yes</div>
        <div>Run ID: {runId}</div>
        <div>Status: {run.status}</div>
      </div>
    </div>
  );
}
