"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getRun, getRunCounts, acceptRun, deleteRun, getReportXlsxUrl, getReportTxtUrl } from '../../../lib/api';
import { RunDetail, RunCounts } from '../../../lib/types';

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'processing':
      return 'badge-processing';
    case 'completed':
      return 'badge-completed';
    case 'failed':
      return 'badge-failed';
    case 'accepted':
      return 'badge-accepted';
    default:
      return '';
  }
}

function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) || 0 : value;
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(num);
}

function formatUSDT(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Helper functions for safe ID handling
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
  const runId = params.id as string;

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
        getRun(runId).catch(err => {
          setError(err.message || 'Ошибка загрузки запуска');
          return null;
        }),
        getRunCounts(runId).catch(() => null)
      ]);
      setRun((runResult as RunDetail) || null);
      setCounts((countsResult as RunCounts) || null);
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
      router.push('/runs');
    } catch (err: unknown) {
      const error = err as { message?: string };
      alert(error.message || 'Ошибка при удалении');
    } finally {
      setActionLoading(false);
    }
  }

  // Always render the page - no blocking loading screen
  return (
    <div className="container">
      <div className="page-header">
        <h1>Запуск сверки: {run ? getShortRunId(run) + '...' : runId}</h1>
        <Link href="/runs" className="secondary">← К списку запусков</Link>
      </div>

      {loading && (
        <div className="card">
          <div className="empty-state">Загрузка данных запуска...</div>
        </div>
      )}

      {error && (
        <div className="card">
          <div className="error mb-4">{error}</div>
          <button onClick={loadRun} className="secondary">
            Повторить загрузку
          </button>
        </div>
      )}

      {!run && !loading && !error && (
        <div className="card">
          <div className="empty-state">Запуск не найден</div>
          <button onClick={loadRun} className="secondary">
            Повторить загрузку
          </button>
        </div>
      )}

      {run && (
        <>
          <div className="grid grid-2">
            {/* Status Card */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Статус</div>
              </div>
              <div className="stat-card" style={{ textAlign: 'center' }}>
                <span className={`badge ${getStatusBadgeClass(run.status)}`}>
                  {run.status}
                </span>
                <div className="stat-label" style={{ marginTop: '0.5rem' }}>
                  {run.status === 'processing' && 'В обработке...'}
                  {run.status === 'completed' && 'Обработка завершена'}
                  {run.status === 'failed' && 'Ошибка обработки'}
                  {run.status === 'accepted' && 'Подтверждено'}
                </div>
              </div>
            </div>

            {/* Period Card */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Период</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{run.period_start || "—"} — {run.period_end || "—"}</div>
                <div className="stat-label">Создан: {formatDate(run.created_at)}</div>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Итоги сверки</div>
            </div>
            <div className="grid grid-4">
              <div className="stat-card">
                <div className="stat-value">{formatUSDT(run.gateway_usdt_amount)}</div>
                <div className="stat-label">Gateway USDT</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{formatUSDT(run.calculated_usdt_amount)}</div>
                <div className="stat-label">Calculated USDT</div>
              </div>
              <div className="stat-card">
                <div className={`stat-value ${run.usdt_difference !== 0 ? 'text-warning' : ''}`}>
                  {formatUSDT(run.usdt_difference)}
                </div>
                <div className="stat-label">Разница USDT</div>
              </div>
              <div className="stat-card">
                <div className={`stat-value ${run.rub_difference !== 0 ? 'text-warning' : ''}`}>
                  {formatCurrency(run.rub_difference)}
                </div>
                <div className="stat-label">Разница RUB</div>
              </div>
            </div>
          </div>

          {/* Counts */}
          {counts && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">Количество записей</div>
              </div>
              <div className="grid grid-4">
                <div className="stat-card">
                  <div className="stat-value">{counts.total}</div>
                  <div className="stat-label">Всего</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{counts.matched}</div>
                  <div className="stat-label">Сверено</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{counts.unmatched_gateway}</div>
                  <div className="stat-label">Без пары (Gateway)</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{counts.unmatched_onlipay}</div>
                  <div className="stat-label">Без пары (OnliPay)</div>
                </div>
              </div>
            </div>
          )}

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
        </>
      )}
    </div>
  );
}
