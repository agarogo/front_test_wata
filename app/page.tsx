"use client";

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setRunsLoading(true);
    setGroupsLoading(true);
    setRunsError(null);
    setGroupsError(null);
    
    try {
      const runsResult = await getRuns().catch(err => {
        setRunsError(err.message || 'Ошибка загрузки запусков');
        return null;
      });
      setRuns((runsResult as RunSummary[]) || []);
    } finally {
      setRunsLoading(false);
    }

    try {
      const groupsResult = await getCommissionGroups().catch(err => {
        setGroupsError(err.message || 'Ошибка загрузки ставок');
        return null;
      });
      setCommissionGroups(groupsResult || []);
    } finally {
      setGroupsLoading(false);
    }
  }

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
          <Link href="/settings/commissions" className="text-sm">
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
            <div className="stat-label">Ошибки</div>
          </div>
        </div>
      </div>

      {/* Latest Runs */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Последние запуски</div>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Статус</th>
                <th>Период</th>
                <th>Создан</th>
                <th>Разница USDT</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {runsLoading ? (
                <tr>
                  <td colSpan={6} className="empty-state">Загрузка запусков...</td>
                </tr>
              ) : runs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-state">Пока нет запусков сверки</td>
                </tr>
              ) : (
                runs.slice(0, 10).map((run) => (
                  <tr key={run.id}>
                    <td className="text-sm">{run.id.slice(0, 8)}...</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(run.status)}`}>
                        {run.status}
                      </span>
                    </td>
                    <td className="text-sm">
                      {run.period_start} — {run.period_end}
                    </td>
                    <td className="text-sm">{formatDate(run.created_at)}</td>
                    <td className={run.usdt_difference !== 0 ? 'text-warning' : ''}>
                      {formatUSDT(run.usdt_difference)}
                    </td>
                    <td>
                      <a href={`/runs/${run.id}`} className="text-sm">
                        Подробнее →
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {runs.length > 0 && (
          <Link href="/runs" className="text-sm">
            Показать все запуски →
          </Link>
        )}
      </div>

      {/* Retry Button */}
      <div className="card">
        <button onClick={loadData} className="secondary">
          Повторить загрузку
        </button>
      </div>

      {/* Debug Block */}
      <div className="card" style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
        <div className="card-title">Debug Info</div>
        <div>API: http://10.129.0.9:8055</div>
        <div>Hydrated: yes</div>
        <div>Runs: {runs.length} items</div>
        <div>Groups: {commissionGroups.length} items</div>
        <div>Runs Loading: {runsLoading ? 'yes' : 'no'}</div>
        <div>Groups Loading: {groupsLoading ? 'yes' : 'no'}</div>
      </div>
    </div>
  );
}
