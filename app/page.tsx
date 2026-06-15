"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getRuns, createRun, getCommissionGroups } from '../lib/api';
import { RunSummary, CommissionGroup } from '../lib/types';

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

function formatRate(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) || 0 : value;
  return (num * 100).toFixed(2) + '%';
}

// Helper functions for safe ID handling
function getRunId(run: RunSummary): string {
  return String(run.id ?? "");
}

function getShortRunId(run: RunSummary): string {
  const id = getRunId(run);
  return id ? id.slice(0, 8) : "—";
}

export default function Home() {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [commissionGroups, setCommissionGroups] = useState<CommissionGroup[]>([]);
  const [runsLoading, setRunsLoading] = useState(true);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [runsError, setRunsError] = useState<string | null>(null);
  const [groupsError, setGroupsError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    file: null as File | null,
    period_start: '',
    period_end: '',
    gateway_sum_wata_base: '',
    gateway_sum_wata_131: '',
    gateway_sum_wata_adult: '',
    gateway_sum_wata_case: '',
    gateway_total_rub: '',
    conversion_commission_rate: '',
    conversion_commission_amount: '',
    fx_rate: '',
    gateway_usdt_amount: '',
    chargebacks_file: null as File | null
  });

  const loadRuns = useCallback(async () => {
    setRunsLoading(true);
    setRunsError(null);
    try {
      const result = await getRuns();
      setRuns(Array.isArray(result) ? (result as RunSummary[]) : []);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setRunsError(error.message || 'Ошибка загрузки запусков');
      setRuns([]);
    } finally {
      setRunsLoading(false);
    }
  }, []);

  const loadGroups = useCallback(async () => {
    setGroupsLoading(true);
    setGroupsError(null);
    try {
      const result = await getCommissionGroups();
      setCommissionGroups(Array.isArray(result) ? (result as CommissionGroup[]) : []);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setGroupsError(error.message || 'Ошибка загрузки ставок');
      setCommissionGroups([]);
    } finally {
      setGroupsLoading(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    await Promise.allSettled([loadRuns(), loadGroups()]);
  }, [loadRuns, loadGroups]);

  // Initial load - используем pattern с async function внутри useEffect
  useEffect(() => {
    const init = async () => {
      await loadRuns();
      await loadGroups();
    };
    init();
  }, [loadRuns, loadGroups]);

  // Timeout handler - выключает loading если запросы висят слишком долго
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (runsLoading) {
        setRunsLoading(false);
        setRunsError('Запрос запусков занял слишком много времени');
      }
      if (groupsLoading) {
        setGroupsLoading(false);
        setGroupsError('Запрос ставок занял слишком много времени');
      }
    }, 20000);

    return () => clearTimeout(timeoutId);
  }, [runsLoading, groupsLoading]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, field: 'file' | 'chargebacks_file') {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, [field]: file }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUploadError(null);
    setUploadSuccess(null);

    if (!formData.file) {
      setUploadError('Выберите Excel файл для загрузки');
      return;
    }

    if (!formData.period_start || !formData.period_end) {
      setUploadError('Укажите даты периода');
      return;
    }

    if (!formData.fx_rate || parseFloat(formData.fx_rate) <= 0) {
      setUploadError('Укажите корректный курс валюты');
      return;
    }

    if (!formData.gateway_usdt_amount) {
      setUploadError('Укажите сумму в USDT');
      return;
    }

    try {
      setUploading(true);
      const form = new FormData();
      form.append('file', formData.file);
      form.append('period_start', formData.period_start);
      form.append('period_end', formData.period_end);
      form.append('fx_rate', formData.fx_rate);
      form.append('gateway_usdt_amount', formData.gateway_usdt_amount);

      if (formData.gateway_sum_wata_base) form.append('gateway_sum_wata_base', formData.gateway_sum_wata_base);
      if (formData.gateway_sum_wata_131) form.append('gateway_sum_wata_131', formData.gateway_sum_wata_131);
      if (formData.gateway_sum_wata_adult) form.append('gateway_sum_wata_adult', formData.gateway_sum_wata_adult);
      if (formData.gateway_sum_wata_case) form.append('gateway_sum_wata_case', formData.gateway_sum_wata_case);
      if (formData.gateway_total_rub) form.append('gateway_total_rub', formData.gateway_total_rub);
      if (formData.conversion_commission_rate) form.append('conversion_commission_rate', formData.conversion_commission_rate);
      if (formData.conversion_commission_amount) form.append('conversion_commission_amount', formData.conversion_commission_amount);
      if (formData.chargebacks_file) form.append('chargebacks_file', formData.chargebacks_file);

      const result = await createRun(form);
      setUploadSuccess(`Запуск создан: ${result.id || 'успешно'}`);
      
      // Очистить форму
      setFormData({
        file: null,
        period_start: '',
        period_end: '',
        gateway_sum_wata_base: '',
        gateway_sum_wata_131: '',
        gateway_sum_wata_adult: '',
        gateway_sum_wata_case: '',
        gateway_total_rub: '',
        conversion_commission_rate: '',
        conversion_commission_amount: '',
        fx_rate: '',
        gateway_usdt_amount: '',
        chargebacks_file: null
      });
      
      // Обновить список запусков
      await loadData();
    } catch (err: unknown) {
      const error = err as { message?: string };
      setUploadError(error.message || 'Ошибка при создании запуска');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="container">
      <h1>OnliPay Reconciliation Dashboard</h1>

      <div className="grid grid-2">
        {/* Upload Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Новый запуск сверки</div>
          </div>
          
          <form onSubmit={handleSubmit}>
            {uploadError && <div className="error mb-4">{uploadError}</div>}
            {uploadSuccess && <div className="success mb-4" style={{ color: 'var(--success)' }}>{uploadSuccess}</div>}

            <div className="form-group">
              <label>Excel файл *</label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => handleFileChange(e, 'file')}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Начало периода *</label>
                <input
                  type="date"
                  name="period_start"
                  value={formData.period_start}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Конец периода *</label>
                <input
                  type="date"
                  name="period_end"
                  value={formData.period_end}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Курс валюты (FX Rate) *</label>
                <input
                  type="number"
                  name="fx_rate"
                  value={formData.fx_rate}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label>Сумма в USDT *</label>
                <input
                  type="number"
                  name="gateway_usdt_amount"
                  value={formData.gateway_usdt_amount}
                  onChange={handleInputChange}
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Gateway WATA Base</label>
                <input
                  type="number"
                  name="gateway_sum_wata_base"
                  value={formData.gateway_sum_wata_base}
                  onChange={handleInputChange}
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>Gateway WATA 131</label>
                <input
                  type="number"
                  name="gateway_sum_wata_131"
                  value={formData.gateway_sum_wata_131}
                  onChange={handleInputChange}
                  step="0.01"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Gateway WATA Adult</label>
                <input
                  type="number"
                  name="gateway_sum_wata_adult"
                  value={formData.gateway_sum_wata_adult}
                  onChange={handleInputChange}
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>Gateway WATA Case</label>
                <input
                  type="number"
                  name="gateway_sum_wata_case"
                  value={formData.gateway_sum_wata_case}
                  onChange={handleInputChange}
                  step="0.01"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Gateway Total RUB</label>
              <input
                type="number"
                name="gateway_total_rub"
                value={formData.gateway_total_rub}
                onChange={handleInputChange}
                step="0.01"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Conversion Commission Rate</label>
                <input
                  type="number"
                  name="conversion_commission_rate"
                  value={formData.conversion_commission_rate}
                  onChange={handleInputChange}
                  step="0.0001"
                />
              </div>
              <div className="form-group">
                <label>Conversion Commission Amount</label>
                <input
                  type="number"
                  name="conversion_commission_amount"
                  value={formData.conversion_commission_amount}
                  onChange={handleInputChange}
                  step="0.01"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Chargebacks файл (опционально)</label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => handleFileChange(e, 'chargebacks_file')}
              />
            </div>

            <button type="submit" disabled={uploading}>
              {uploading ? 'Загрузка...' : 'Запустить сверку'}
            </button>
          </form>
        </div>

        {/* Reference Rates */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Ставки комиссий OnliPay</div>
          </div>
          
          {groupsError && <div className="error mb-4">{groupsError}</div>}
          
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Группа</th>
                  <th>Gateway Point</th>
                  <th>Ставка</th>
                  <th>Мин. комиссия</th>
                  <th>Фикс. комиссия</th>
                </tr>
              </thead>
              <tbody>
                {groupsLoading ? (
                  <tr>
                    <td colSpan={5} className="empty-state">Загрузка ставок...</td>
                  </tr>
                ) : commissionGroups.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-state">Нет данных о ставках</td>
                  </tr>
                ) : (
                  commissionGroups.map((group) => (
                    <tr key={group.group_code}>
                      <td>{group.label || group.group_code}</td>
                      <td className="text-sm">{group.gateway_point}</td>
                      <td>{formatRate(group.commission_rate)}</td>
                      <td>{formatCurrency(group.min_commission)}</td>
                      <td>{formatCurrency(group.fixed_commission)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Link href="/reference/commissions" className="text-sm">
            Настроить ставки →
          </Link>
        </div>
      </div>

      {/* Quick Totals */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Быстрые итоги</div>
        </div>
        
        {runsError && <div className="error mb-4">{runsError}</div>}
        
        <div className="grid grid-4">
          <div className="stat-card">
            <div className="stat-value">{runs.length}</div>
            <div className="stat-label">Всего запусков</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{runs.filter(r => r.status === 'completed').length}</div>
            <div className="stat-label">Завершено</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{runs.filter(r => r.status === 'processing').length}</div>
            <div className="stat-label">В обработке</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{runs.filter(r => r.status === 'failed').length}</div>
            <div className="stat-label">С ошибками</div>
          </div>
        </div>
      </div>

      {/* Recent Runs */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Последние запуски</div>
          <Link href="/reconciliation/history" className="text-sm">Все запуски →</Link>
        </div>
        
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
              {runsLoading ? (
                <tr>
                  <td colSpan={11} className="empty-state">Загрузка запусков...</td>
                </tr>
              ) : runs.length === 0 ? (
                <tr>
                  <td colSpan={11} className="empty-state">Пока нет запусков сверки</td>
                </tr>
              ) : (
                runs.slice(0, 5).map((run, index) => (
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Retry Button */}
      {(runsError || groupsError) && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Загрузка данных</div>
          </div>
          <button onClick={() => loadData()} className="btn">
            Повторить загрузку
          </button>
        </div>
      )}

      {/* Debug Block */}
      <div className="card" style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
        <div className="card-title">Debug Info</div>
        <div>API: http://10.129.0.9:5050</div>
        <div>Hydrated: yes</div>
        <div>Runs: {runs.length} items</div>
        <div>Commission Groups: {commissionGroups.length} items</div>
        <div>Runs Loading: {runsLoading ? 'yes' : 'no'}</div>
        <div>Groups Loading: {groupsLoading ? 'yes' : 'no'}</div>
        <div>Runs Error: {runsError || 'none'}</div>
        <div>Groups Error: {groupsError || 'none'}</div>
      </div>
    </div>
  );
}
