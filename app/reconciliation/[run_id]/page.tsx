'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { acceptRun, calculateRun, getReport, getReportTxtUrl, getReportXlsxUrl, getRun } from '../../../lib/api';
import { getCachedRunDetail, setCachedReport, setCachedRunDetail, upsertCachedRun } from '../../../lib/run-cache';
import type { FinancialReport, ReconciliationRun } from '../../../lib/types';
import ApiErrorAlert from '../../../components/ApiErrorAlert';
import LoadingState from '../../../components/LoadingState';
import StatusBadge from '../../../components/StatusBadge';
import MoneyValue from '../../../components/MoneyValue';

function formatDate(value?: string) {
  if (!value) return '—';
  return value.replace('T', ' ').slice(0, 16);
}

function valueOrDash(value: unknown) {
  return value === undefined || value === null || value === '' ? '—' : String(value);
}

function dataSourceLabel(value?: string) {
  if (value === 'excel_upload') return 'Данные загружены из Excel';
  if (value === 'linked_run') return 'Расчёт выполнен из уже сохранённого run';
  if (value === 'database_period') return 'Расчёт выполнен из БД по периоду';
  return value || '—';
}

function countFrom(run: ReconciliationRun | null, report: FinancialReport | null, key: string) {
  const parsed = run?.parsed_counts as Record<string, unknown> | undefined;
  const missing = run?.missing_counts as Record<string, unknown> | undefined;
  return parsed?.[key] ?? missing?.[key] ?? report?.[key] ?? '—';
}

export default function RunDetailPage({ params }: { params: Promise<{ run_id: string }> }) {
  const { run_id } = use(params);
  const runId = decodeURIComponent(run_id);
  const [run, setRun] = useState<ReconciliationRun | null>(null);
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const status = String(run?.status || 'draft');
  const canCalculate = ['draft', 'data_loaded', 'loaded', 'failed'].includes(status);
  const canAccept = status === 'calculated';

  const mergeAndSetRun = useCallback((next: ReconciliationRun) => {
    const normalized = { ...next, id: next.id ?? runId, run_id: next.run_id ?? runId };
    setRun(normalized);
    setCachedRunDetail(runId, normalized);
    upsertCachedRun(normalized);
  }, [runId]);

  const load = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    else setRefreshing(true);
    setError(null);
    setWarning(null);
    const cached = getCachedRunDetail(runId);
    if (cached) {
      setRun(cached);
      setLoading(false);
    }
    try {
      const [runResult, reportResult] = await Promise.allSettled([getRun(runId), getReport(runId)]);
      if (runResult.status === 'fulfilled') mergeAndSetRun({ ...(cached || {}), ...runResult.value });
      else if (!cached) throw runResult.reason;
      else setWarning('Показаны сохранённые данные');

      if (reportResult.status === 'fulfilled') {
        setReport(reportResult.value);
        setCachedReport(runId, reportResult.value);
      }
    } catch (err) {
      if (!cached) setError(err);
      else setWarning('Показаны сохранённые данные');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [mergeAndSetRun, runId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function handleCalculate() {
    setActionLoading(true);
    setMessage(null);
    setError(null);
    try {
      const result = await calculateRun(runId) as ReconciliationRun;
      setMessage('Расчёт выполнен');
      mergeAndSetRun({ ...(run || {}), ...result, status: result.status || 'calculated' });
      await load(false);
    } catch (err) {
      setError(err);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAccept() {
    if (!window.confirm('Вы уверены? После принятия промежуточные таблицы будут перенесены в постоянные состояния.')) return;
    setActionLoading(true);
    setMessage(null);
    setError(null);
    try {
      await acceptRun(runId);
      setMessage('Результат принят');
      mergeAndSetRun({ ...(run || {}), id: runId, run_id: runId, status: 'accepted' });
      await load(false);
    } catch (err) {
      setError(err);
    } finally {
      setActionLoading(false);
    }
  }

  const metaRows = useMemo(() => ([
    ['ID', runId],
    ['Статус', run?.status || '—'],
    ['Период', `${run?.period_start || report?.period_start || '—'} — ${run?.period_end || report?.period_end || '—'}`],
    ['Data source', dataSourceLabel(run?.data_source)],
    ['Источник данных', run?.source_run_id || '—'],
    ['Создан', formatDate(run?.created_at)],
    ['Обновлён', formatDate(run?.updated_at)],
  ]), [report, run, runId]);

  if (loading && !run) return <LoadingState label="Загрузка запуска..." />;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Запуск</div>
          <h1>Сверка {runId.slice(0, 8)}</h1>
          <p>Результат расчёта, отчёты, таблицы и принятие сверки.</p>
        </div>
        <div className="actions">
          <button className="btn btn-primary" onClick={() => void load(false)} disabled={refreshing}>{refreshing ? 'Обновляю...' : 'Обновить'}</button>
          <Link className="btn btn-primary" href="/reconciliation/history">История</Link>
          <Link className="btn btn-primary" href={`/reconciliation/${runId}/tables`}>Открыть таблицы</Link>
        </div>
      </div>

      {error ? <ApiErrorAlert error={error} title="Ошибка запуска" onRetry={() => load(false)} /> : null}
      {warning && <div className="alert"><strong>{warning}</strong></div>}
      {message && <div className="alert"><strong>{message}</strong></div>}
      {run?.warnings?.length ? <div className="alert"><strong>Warnings:</strong><span>{run.warnings.join('; ')}</span></div> : null}

      <div className="grid-3">
        <div className="metric-card"><span>WATA payments count</span><strong>{valueOrDash(countFrom(run, report, 'wata_payments'))}</strong></div>
        <div className="metric-card"><span>Carry-over count</span><strong>{valueOrDash(countFrom(run, report, 'carry_over_payments'))}</strong></div>
        <div className="metric-card"><span>OnliPay base count</span><strong>{valueOrDash(countFrom(run, report, 'onlipay_wata_base'))}</strong></div>
        <div className="metric-card"><span>OnliPay 131 count</span><strong>{valueOrDash(countFrom(run, report, 'onlipay_wata_131'))}</strong></div>
        <div className="metric-card"><span>OnliPay adult count</span><strong>{valueOrDash(countFrom(run, report, 'onlipay_wata_adult'))}</strong></div>
        <div className="metric-card"><span>OnliPay case count</span><strong>{valueOrDash(countFrom(run, report, 'onlipay_wata_case'))}</strong></div>
        <div className="metric-card"><span>Discrepancies count</span><strong>{valueOrDash(run?.discrepancies_count ?? report?.discrepancies_count)}</strong></div>
        <div className="metric-card"><span>Gateway missing count</span><strong>{valueOrDash(countFrom(run, report, 'gateway_missing_in_wata_current'))}</strong></div>
        <div className="metric-card"><span>WATA missing count</span><strong>{valueOrDash(countFrom(run, report, 'wata_missing_in_gateway_current'))}</strong></div>
      </div>

      <div className="grid-3">
        <div className="metric-card"><span>Final RUB amount</span><strong><MoneyValue value={report?.final_rub_amount ?? run?.financial_report?.final_rub_amount ?? run?.final_rub_amount} currency="RUB" /></strong></div>
        <div className="metric-card"><span>Calculated USDT amount</span><strong><MoneyValue value={report?.calculated_usdt_amount ?? run?.financial_report?.calculated_usdt_amount ?? run?.calculated_usdt_amount} currency="USDT" /></strong></div>
        <div className="metric-card"><span>USDT difference</span><strong><MoneyValue value={report?.usdt_difference ?? run?.financial_report?.usdt_difference ?? run?.usdt_difference} currency="USDT" /></strong></div>
      </div>

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
            {canCalculate ? <button className="btn btn-primary" onClick={handleCalculate} disabled={actionLoading}>Запустить расчёт</button> : null}
            {canAccept ? <button className="btn btn-success" onClick={handleAccept} disabled={actionLoading}>Принять сверку</button> : null}
            {status === 'accepted' ? <span className="badge badge-success">Принято</span> : null}
            <a className="btn btn-dark" href={getReportXlsxUrl(runId)}>Скачать Excel отчёт</a>
            <a className="btn btn-dark" href={getReportTxtUrl(runId)}>Скачать TXT отчёт</a>
            <Link className="btn btn-secondary" href={`/reconciliation/${runId}/report`}>Открыть отчёт</Link>
            <Link className="btn btn-secondary" href={`/reconciliation/${runId}/tables`}>Открыть таблицы</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
