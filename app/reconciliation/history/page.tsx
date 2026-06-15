"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getRuns } from '../../lib/api';
import { RunSummary } from '../../lib/types';
import ApiErrorAlert from '../../components/ApiErrorAlert';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';

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

function getRunId(run: RunSummary): string {
  return String(run.id ?? "");
}

function getShortRunId(run: RunSummary): string {
  const id = getRunId(run);
  return id ? id.slice(0, 8) : "—";
}

export default function HistoryPage() {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRuns = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getRuns();
      setRuns(Array.isArray(result) ? (result as RunSummary[]) : []);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Ошибка загрузки запусков');
      setRuns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRuns();
  }, []);

  if (loading) {
    return (
      <div className="container">
        <div className="page-header">
          <h1>История запусков</h1>
          <Link href="/reconciliation/new" className="secondary">← Новый запуск</Link>
        </div>
        <LoadingState label="Загрузка истории запусков..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="page-header">
          <h1>История запусков</h1>
          <Link href="/reconciliation/new" className="secondary">← Новый запуск</Link>
        </div>
        <ApiErrorAlert error={error} title="Ошибка загрузки" onRetry={loadRuns} />
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="container">
        <div className="page-header">
          <h1>История запусков</h1>
          <Link href="/reconciliation/new" className="secondary">← Новый запуск</Link>
        </div>
        <EmptyState
          title="Нет запусков"
          description="Пока нет истории запусков сверки"
          action={
            <Link href="/reconciliation/new" className="primary">
              Создать первый запуск
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>История запусков</h1>
        <Link href="/reconciliation/new" className="secondary">← Новый запуск</Link>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Статус</th>
                <th>Период</th>
                <th>Создан</th>
                <th>Gateway USDT</th>
                <th>Calculated USDT</th>
                <th>Разница USDT</th>
                <th>Gateway RUB</th>
                <th>Calculated RUB</th>
                <th>Разница RUB</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run, index) => (
                <tr key={getRunId(run) || index}>
                  <td className="text-sm">{getShortRunId(run)}...</td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(run.status)}`}>
                      {run.status}
                    </span>
                  </td>
                  <td className="text-sm">
                    {run.period_start || "—"} — {run.period_end || "—"}
                  </td>
                  <td className="text-sm">{formatDate(run.created_at)}</td>
                  <td>{formatUSDT(run.gateway_usdt_amount)}</td>
                  <td>{formatUSDT(run.calculated_usdt_amount)}</td>
                  <td className={run.usdt_difference !== 0 ? 'text-warning' : ''}>
                    {formatUSDT(run.usdt_difference)}
                  </td>
                  <td>{formatCurrency(run.gateway_total_rub)}</td>
                  <td>{formatCurrency(run.calculated_total_rub)}</td>
                  <td className={run.rub_difference !== 0 ? 'text-warning' : ''}>
                    {formatCurrency(run.rub_difference)}
                  </td>
                  <td>
                    <Link href={`/reconciliation/${getRunId(run)}`} className="text-sm">
                      Подробнее →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <button onClick={loadRuns} className="secondary">
          Повторить загрузку
        </button>
      </div>
    </div>
  );
}
