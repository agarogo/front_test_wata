"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getRun } from '../../../../lib/api';
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

const TABLE_TABS = [
  { key: 'carry_over_payments_pending', label: 'Carry Over Payments Pending' },
  { key: 'gateway_missing_in_wata_current', label: 'Gateway Missing in WATA (Current)' },
  { key: 'gateway_missing_in_wata_resolved', label: 'Gateway Missing in WATA (Resolved)' },
  { key: 'wata_missing_in_gateway_current', label: 'WATA Missing in Gateway (Current)' },
  { key: 'wata_missing_in_gateway_resolved', label: 'WATA Missing in Gateway (Resolved)' },
  { key: 'amount_commission_discrepancies', label: 'Amount/Commission Discrepancies' },
  { key: 'carry_over_payments', label: 'Carry Over Payments' },
  { key: 'mismatch_gateway_not_found', label: 'Mismatch Gateway Not Found' },
  { key: 'mismatch_wata_not_found', label: 'Mismatch WATA Not Found' },
  { key: 'gateway_refunds', label: 'Gateway Refunds' }
];

export default function TablesPage() {
  const params = useParams();
  const runId = params.run_id as string;

  const [run, setRun] = useState<RunDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(TABLE_TABS[0].key);

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
          <h1>Таблицы: {runId}</h1>
          <Link href={`/reconciliation/${runId}`} className="secondary">← Назад к запуску</Link>
        </div>
        <LoadingState label="Загрузка таблиц..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="page-header">
          <h1>Таблицы: {runId}</h1>
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
          <h1>Таблицы: {runId}</h1>
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
        <h1>Таблицы: {getShortRunId(run)}...</h1>
        <Link href={`/reconciliation/${runId}`} className="secondary">← Назад к запуску</Link>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {TABLE_TABS.map(tab => (
          <button
            key={tab.key}
            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table Content */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            {TABLE_TABS.find(t => t.key === activeTab)?.label}
          </div>
        </div>

        {/* Tables API not implemented message */}
        <EmptyState
          title="API таблиц не реализовано"
          description="Таблицы API пока не доступны. Используйте отчеты Excel или TXT для детального анализа."
          action={
            <Link href={`/reconciliation/${runId}/report`} className="secondary">
              Перейти к отчетам
            </Link>
          }
        />
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
