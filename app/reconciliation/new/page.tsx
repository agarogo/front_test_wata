"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createRun } from '../../../lib/api';
import ApiErrorAlert from '../../../components/ApiErrorAlert';
import LoadingState from '../../../components/LoadingState';

export default function NewReconciliationPage() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    file: null as File | null,
    period_start: '',
    period_end: '',
    gateway_final_rub_amount: '',
    gateway_usdt_amount: '',
    fx_rate: '',
    conversion_commission_rate: '',
    conversion_commission_amount: '',
    wata_base_rub_amount: '',
    wata_131_rub_amount: '',
    wata_adult_rub_amount: '',
    wata_case_rub_amount: ''
  });

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, file }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.file) {
      setError('Выберите Excel файл для загрузки');
      return;
    }

    if (!formData.period_start || !formData.period_end) {
      setError('Укажите даты периода');
      return;
    }

    if (!formData.fx_rate || parseFloat(formData.fx_rate) <= 0) {
      setError('Укажите корректный курс валюты');
      return;
    }

    if (!formData.gateway_usdt_amount) {
      setError('Укажите сумму в USDT');
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

      if (formData.gateway_final_rub_amount) {
        form.append('gateway_total_rub', formData.gateway_final_rub_amount);
      }
      if (formData.conversion_commission_rate) {
        form.append('conversion_commission_rate', formData.conversion_commission_rate);
      }
      if (formData.conversion_commission_amount) {
        form.append('conversion_commission_amount', formData.conversion_commission_amount);
      }
      if (formData.wata_base_rub_amount) {
        form.append('gateway_sum_wata_base', formData.wata_base_rub_amount);
      }
      if (formData.wata_131_rub_amount) {
        form.append('gateway_sum_wata_131', formData.wata_131_rub_amount);
      }
      if (formData.wata_adult_rub_amount) {
        form.append('gateway_sum_wata_adult', formData.wata_adult_rub_amount);
      }
      if (formData.wata_case_rub_amount) {
        form.append('gateway_sum_wata_case', formData.wata_case_rub_amount);
      }

      const result = await createRun(form);
      const runId = result?.id || 'unknown';
      setSuccess(`Запуск создан: ${String(runId).slice(0, 8)}...`);
      
      // Очистить форму
      setFormData({
        file: null,
        period_start: '',
        period_end: '',
        gateway_final_rub_amount: '',
        gateway_usdt_amount: '',
        fx_rate: '',
        conversion_commission_rate: '',
        conversion_commission_amount: '',
        wata_base_rub_amount: '',
        wata_131_rub_amount: '',
        wata_adult_rub_amount: '',
        wata_case_rub_amount: ''
      });

      // Перенаправление на страницу запуска через небольшую задержку
      setTimeout(() => {
        router.push(`/reconciliation/${runId}`);
      }, 1500);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Ошибка при создании запуска');
    } finally {
      setUploading(false);
    }
  }

  if (uploading) {
    return (
      <div className="container">
        <div className="page-header">
          <h1>Новый запуск сверки</h1>
          <Link href="/reconciliation/history" className="secondary">← История</Link>
        </div>
        <LoadingState label="Загрузка файла и создание запуска..." />
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Новый запуск сверки</h1>
        <Link href="/reconciliation/history" className="secondary">← История</Link>
      </div>

      {error && <ApiErrorAlert error={error} title="Ошибка создания запуска" />}
      {success && <div className="success mb-4" style={{ color: 'var(--success)' }}>{success}</div>}

      <div className="card">
        <div className="card-header">
          <div className="card-title">Форма создания запуска</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Excel файл *</label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
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

          <div className="form-group">
            <label>Gateway Final RUB Amount</label>
            <input
              type="number"
              name="gateway_final_rub_amount"
              value={formData.gateway_final_rub_amount}
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

          <div className="form-row">
            <div className="form-group">
              <label>WATA Base RUB Amount</label>
              <input
                type="number"
                name="wata_base_rub_amount"
                value={formData.wata_base_rub_amount}
                onChange={handleInputChange}
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label>WATA 131 RUB Amount</label>
              <input
                type="number"
                name="wata_131_rub_amount"
                value={formData.wata_131_rub_amount}
                onChange={handleInputChange}
                step="0.01"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>WATA Adult RUB Amount</label>
              <input
                type="number"
                name="wata_adult_rub_amount"
                value={formData.wata_adult_rub_amount}
                onChange={handleInputChange}
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label>WATA Case RUB Amount</label>
              <input
                type="number"
                name="wata_case_rub_amount"
                value={formData.wata_case_rub_amount}
                onChange={handleInputChange}
                step="0.01"
              />
            </div>
          </div>

          <button type="submit" disabled={uploading}>
            {uploading ? 'Загрузка...' : 'Создать запуск'}
          </button>
        </form>
      </div>
    </div>
  );
}
