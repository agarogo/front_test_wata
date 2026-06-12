"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getRun, getRunCounts, acceptRun, getReportXlsxUrl, getReportTxtUrl } from '../../../lib/api';
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

function formatRate(value: number): string {
  return (value * 100).toFixed(2) + '%';
}

export default function RunDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [run, setRun] = useState<RunDetail | null>(null);
  const [counts, setCounts] = useState<RunCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!id) {
      setError('ID запуска не указан');
      setLoading(false);
      return;
    }
    loadData();
  }, [id]);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      
      const [runData, countsData] = await Promise.allSettled([
        getRun(id),
        getRunCounts(id)
      ]);

      if (runData.status === 'fulfilled') {
        setRun(runData.value || null);
      } else {
        setError(runData.reason?.message || 'Ошибка загрузки данных запуска');
      }

      if (countsData.status === 'fulfilled') {
        setCounts(countsData.value || null);
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept() {
    if (!confirm('Подтвердить этот запуск сверки?')) {
      return;
    }

    try {
      setAccepting(true);
      await acceptRun(id);
      await loadData();
      alert('Запуск успешно подтверждён');
    } catch (err: any) {
      alert(err.message || 'Ошибка при подтверждении запуска');
    } finally {
      setAccepting(false);
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

  if (error && !run) {
    return (
      <div className="container">
        <div className="flex justify-between items-center mb-6">
          <h1>Детали запуска</h1>
          <a href="/runs" className="secondary">← К списку</a>
        </div>
        <div className="error">{error}</div>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="container">
        <div className="flex justify-between items-center mb-6">
          <h1>Детали запуска</h1>
          <a href="/runs" className="secondary">← К списку</a>
        </div>
        <div className="empty-state">Запуск не найден</div>
      </div>
    );
  }

  const xlsxUrl = getReportXlsxUrl(id);
  const txtUrl = getReportTxtUrl(id);

  return (
    <div className="container">
      <div className="flex justify-between items-center mb-6">
        <h1>Запуск сверки: {id.slice(0, 8)}...</h1>
        <div className="flex gap-2">
          <a href="/runs" className="secondary">← К списку</a>
          {run.status === 'completed' && (
            <button
              className="primary"
              onClick={handleAccept}
              disabled={accepting || run.status === 'accepted'}
            >
              {accepting ? 'Подтверждение...' : run.status === 'accepted' ? 'Подтверждено' : 'Подтвердить'}
            </button>
          )}
        </div>
      </div>

      {error && <div className="error mb-4">{error}</div>}

      <div className="grid grid-2">
        {/* Status Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Статус</div>
          </div>
          <div className="stat-card large">
            <span className={`badge ${getStatusBadgeClass(run.status)}`}>
              {run.status}
            </span>
          </div>
          <div className="text-sm mt-4">
            <div>Период: {run.period_start} — {run.period_end}</div>
            <div>Создан: {formatDate(run.created_at)}</div>
          </div>
        </div>

        {/* Counts Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Сводка транзакций</div>
          </div>
          {counts ? (
            <div className="grid grid-2">
              <div className="stat-card">
                <div className="stat-value">{counts.total}</div>
                <div className="stat-label">Всего транзакций</div>
              </div>
              <div className="stat-card">
                <div className="stat-value success">{counts.matched}</div>
                <div className="stat-label">Сверено</div>
              </div>
              <div className="stat-card">
                <div className="stat-value warning">{counts.missing_in_onlipay}</div>
                <div className="stat-label">Нет в OnliPay</div>
              </div>
              <div className="stat-card">
                <div className="stat-value warning">{counts.missing_in_gateway}</div>
                <div className="stat-label">Нет в Gateway</div>
              </div>
            </div>
          ) : (
            <div className="text-sm">Нет данных о транзакциях</div>
          )}
        </div>
      </div>

      {/* Gateway Data */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Данные Gateway</div>
        </div>
        <div className="grid grid-2">
          <div className="stat-card">
            <div className="stat-value">{formatCurrency(run.gateway_total_rub)}</div>
            <div className="stat-label">Gateway Total RUB</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{formatUSDT(run.gateway_usdt_amount)}</div>
            <div className="stat-label">Gateway USDT Amount</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{formatCurrency(run.gateway_sum_wata_base)}</div>
            <div className="stat-label">WATA Base</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{formatCurrency(run.gateway_sum_wata_131)}</div>
            <div className="stat-label">WATA 131</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{formatCurrency(run.gateway_sum_wata_adult)}</div>
            <div className="stat-label">WATA Adult</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{formatCurrency(run.gateway_sum_wata_case)}</div>
            <div className="stat-label">WATA Case</div>
          </div>
        </div>
      </div>

      {/* Conversion Data */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Конвертация</div>
        </div>
        <div className="grid grid-3">
          <div className="stat-card">
            <div className="stat-value">{formatRate(run.fx_rate)}</div>
            <div className="stat-label">FX Rate</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{formatRate(run.conversion_commission_rate)}</div>
            <div className="stat-label">Conversion Commission Rate</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{formatCurrency(run.conversion_commission_amount)}</div>
            <div className="stat-label">Conversion Commission Amount</div>
          </div>
        </div>
      </div>

      {/* Differences */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Разницы</div>
        </div>
        <div className="grid grid-2">
          <div className="stat-card">
            <div className={`stat-value ${run.usdt_difference !== 0 ? 'warning' : ''}`}>
              {formatUSDT(run.usdt_difference)}
            </div>
            <div className="stat-label">Разница USDT</div>
          </div>
          <div className="stat-card">
            <div className={`stat-value ${run.rub_difference !== 0 ? 'warning' : ''}`}>
              {formatCurrency(run.rub_difference)}
            </div>
            <div className="stat-label">Разница RUB</div>
          </div>
        </div>
      </div>

      {/* Reports */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Отчёты</div>
        </div>
        <div className="flex gap-4">
          <a
            href={xlsxUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="primary"
          >
            Скачать Excel отчёт
          </a>
          <a
            href={txtUrl}
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
