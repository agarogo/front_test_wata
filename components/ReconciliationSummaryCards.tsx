"use client";

import { RunDetail, RunCounts } from '../lib/types';

interface ReconciliationSummaryCardsProps {
  run?: RunDetail | null;
  counts?: RunCounts | null;
}

export default function ReconciliationSummaryCards({ run, counts }: ReconciliationSummaryCardsProps) {
  if (!run) {
    return null;
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

  return (
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
    </div>
  );
}
