"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getRun, getReportXlsxUrl, getReportTxtUrl } from '../../../../lib/api';
import { RunDetail } from '../../../../lib/types';
import ApiErrorAlert from '../../../../components/ApiErrorAlert';
import LoadingState from '../../../../components/LoadingState';
import EmptyState from '../../../../components/EmptyState';

function getRunId(run: RunDetail): string {
  return String(run.id ?? "");
}

function getShortRunId(run: RunDetail): string {
  const id = getRunId(run);
  return id ? id.slice(0, 8) : "—";
}

function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) || 0 : value;
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(num);
}

function formatUSDT(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

export default function ReportPage() {
  const params = useParams();
  const runId = params.run_id as string;

  const [run, setRun] = useState<RunDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRun = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getRun(runId);
      setRun((result as RunDetail) || null);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Ошибка загрузки запуска');
      setRun(null);
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

  if (loading) {
    return (
      <div className="container">
        <div className="page-header">
          <h1>Отчет: {runId}</h1>
          <Link href={`/reconciliation/${runId}`} className="secondary">← Назад к запуску</Link>
        </div>
        <LoadingState label="Загрузка отчета..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="page-header">
          <h1>Отчет: {runId}</h1>
          <Link href={`/reconciliation/${runId}`} className="secondary">← Назад к запуску</Link>
        </div>
        <ApiErrorAlert error={error} title="Ошибка загрузки" onRetry={loadRun} />
      </div>
    );
  }

  if (!run) {
    return (
      <div className="container">
        <div className="page-header">
          <h1>Отчет: {runId}</h1>
          <Link href={`/reconciliation/${runId}`} className="secondary">← Назад к запуску</Link>
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
        <h1>Отчет: {getShortRunId(run)}...</h1>
        <Link href={`/reconciliation/${runId}`} className="secondary">← Назад к запуску</Link>
      </div>

      {/* Financial Summary Placeholders */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Финансовая сводка</div>
        </div>
        <div className="grid grid-2">
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

      {/* Download Buttons */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Скачать отчет</div>
        </div>
        <div className="actions">
          <a href={getReportXlsxUrl(runId)} className="primary" download>
            Скачать Excel (.xlsx)
          </a>
          <a href={getReportTxtUrl(runId)} className="secondary" download>
            Скачать TXT (.txt)
          </a>
        </div>
      </div>

      {/* Info about JSON report */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Информация</div>
        </div>
        <div className="card-body">
          <p>
            JSON отчет пока не доступен. Используйте Excel или TXT форматы для детального анализа.
          </p>
        </div>
      </div>

      {/* Retry Button */}
      <div className="card">
        <button onClick={loadRun} className="secondary">
          Повторить загрузку
        </button>
      </div>
    </div>
  );
}
