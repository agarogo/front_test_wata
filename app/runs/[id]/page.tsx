"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getRun, getRunCounts, acceptRun, deleteRun, getReportXlsxUrl, getReportTxtUrl } from '../lib/api';
import { RunDetail, RunCounts } from '../lib/types';

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

function getStatusText(status: string): string {
  switch (status) {
    case 'processing':
      return 'В обработке';
    case 'completed':
      return 'Завершено';
    case 'failed':
      return 'Ошибка';
    case 'accepted':
      return 'Принято';
    default:
      return status;
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(value);
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

function formatNumber(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value);
}

export default function RunDetailPage() {
  const params = useParams();
  const router = useRouter();
  const runId = params.id as string;

  const [run, setRun] = useState<RunDetail | null>(null);
  const [counts, setCounts] = useState<RunCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!runId) {
      setError('ID запуска не указан');
      setLoading(false);
      return;
    }
    loadData();
  }, [runId]);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [runData, countsData] = await Promise.all([
        getRun(runId),
        getRunCounts(runId)
      ]);
      setRun(runData);
      setCounts(countsData);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки данных запуска');
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept() {
    if (!confirm('Вы уверены, что хотите принять эту сверку? Это обновит постоянные таблицы.')) {
      return;
    }

    try {
      setAccepting(true);
      await acceptRun(runId);
      alert('Сверка успешно принята!');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Ошибка при принятии сверки');
    } finally {
      setAccepting(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Вы уверены, что хотите удалить этот запуск? Это действие нельзя отменить.')) {
      return;
    }

    try {
      setDeleting(true);
      await deleteRun(runId);
      router.push('/runs');
    } catch (err: any) {
      alert(err.message || 'Ошибка при удалении запуска');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="container">
        <h1>Детали запуска</h1>
        <div className="loading">Загрузка данных...</div>
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="container">
        <h1>Детали запуска</h1>
        <div className="error">{error || 'Запуск не найден'}</div>
        <a href="/runs" className="secondary">← Вернуться к списку</a>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="flex justify-between items-center mb-6">
        <h1>Запуск сверки: {run.id.slice(0, 8)}...</h1>
        <div className="flex gap-2">
          <a href="/runs" className="secondary">← Назад</a>
          {run.status === 'completed' && (
            <button className="success" onClick={handleAccept} disabled={accepting}>
              {accepting ? 'Принятие...' : 'Принять сверку'}
            </button>
          )}
          <button className="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Удаление...' : 'Удалить'}
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="grid grid-2">
        {/* Status Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Статус</div>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <span className={`badge ${getStatusBadgeClass(run.status)}`}>
              {getStatusText(run.status)}
            </span>
            <span className="text-sm text-muted">
              Создан: {formatDate(run.created_at)}
            </span>
          </div>
          <div className="text-sm">
            <p><strong>Период:</strong> {run.period_start} — {run.period_end}</p>
            <p><strong>Курс валюты:</strong> {formatNumber(run.fx_rate)}</p>
            <p><strong>Сумма в USDT:</strong> {formatUSDT(run.gateway_usdt_amount)}</p>
          </div>
        </div>

        {/* Summary Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Итоги сверки</div>
          </div>
          <div className="grid grid-2">
            <div>
              <div className="text-sm text-muted">Разница USDT</div>
              <div className={`stat-value ${run.usdt_difference !== 0 ? 'text-warning' : 'text-success'}`}>
                {formatUSDT(run.usdt_difference)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted">Разница RUB</div>
              <div className={`stat-value ${run.rub_difference !== 0 ? 'text-warning' : 'text-success'}`}>
                {formatCurrency(run.rub_difference)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Counts */}
      {counts && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Количество транзакций</div>
          </div>
          <div className="grid grid-4">
            <div className="stat-card">
              <div className="stat-value">{formatNumber(counts.total)}</div>
              <div className="stat-label">Всего</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{formatNumber(counts.matched)}</div>
              <div className="stat-label">Сверено</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{formatNumber(counts.missing_in_onlipay)}</div>
              <div className="stat-label">Нет в OnliPay</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{formatNumber(counts.missing_in_gateway)}</div>
              <div className="stat-label">Нет в Gateway</div>
            </div>
          </div>
        </div>
      )}

      {/* Reports */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Отчёты</div>
        </div>
        <div className="flex gap-4">
          <a
            href={getReportXlsxUrl(runId)}
            target="_blank"
            rel="noopener noreferrer"
            className="success"
          >
            Скачать Excel отчёт
          </a>
          <a
            href={getReportTxtUrl(runId)}
            target="_blank"
            rel="noopener noreferrer"
            className="secondary"
          >
            Скачать TXT отчёт
          </a>
        </div>
      </div>
    </div>
  );
}
