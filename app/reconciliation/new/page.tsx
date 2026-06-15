'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createRun, getRunId } from '../../../lib/api';
import type { CreateReconciliationRunRequest, ReconciliationRun } from '../../../lib/types';
import ApiErrorAlert from '../../../components/ApiErrorAlert';

const LOCAL_RUNS_KEY = 'onlipay_reconciliation_runs';

function saveLocalRun(run: ReconciliationRun) {
  try {
    const current = JSON.parse(localStorage.getItem(LOCAL_RUNS_KEY) || '[]') as ReconciliationRun[];
    const id = getRunId(run);
    localStorage.setItem(LOCAL_RUNS_KEY, JSON.stringify([run, ...current.filter((item) => getRunId(item) !== id)].slice(0, 50)));
  } catch {}
}

const initialForm = {
  period_start: '',
  period_end: '',
  gateway_final_rub_amount: '0',
  gateway_usdt_amount: '0',
  fx_rate: '90',
  conversion_commission_rate: '0',
  conversion_commission_amount: '0',
  wata_base_rub_amount: '0',
  wata_131_rub_amount: '0',
  wata_adult_rub_amount: '0',
  wata_case_rub_amount: '0',
};

export default function NewReconciliationPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!form.period_start || !form.period_end) {
      setError('Укажи начало и конец периода.');
      return;
    }
    if (new Date(form.period_end) < new Date(form.period_start)) {
      setError('Конец периода не может быть раньше начала.');
      return;
    }
    if (Number(form.fx_rate) <= 0) {
      setError('Курс валюты должен быть больше 0.');
      return;
    }

    const payload: CreateReconciliationRunRequest = {
      period_start: form.period_start,
      period_end: form.period_end,
      gateway_group_rub_amounts: {
        'wata base': form.wata_base_rub_amount || '0',
        'wata 131': form.wata_131_rub_amount || '0',
        'wata adult': form.wata_adult_rub_amount || '0',
        'wata case': form.wata_case_rub_amount || '0',
      },
      gateway_final_rub_amount: form.gateway_final_rub_amount || '0',
      fx_rate: form.fx_rate,
      gateway_usdt_amount: form.gateway_usdt_amount || '0',
      conversion_commission_rate: form.conversion_commission_rate || '0',
      conversion_commission_amount: form.conversion_commission_amount || '0',
    };

    setSaving(true);
    try {
      const run = await createRun(payload);
      saveLocalRun(run);
      const id = getRunId(run);
      router.push(id ? `/reconciliation/${id}` : '/reconciliation/history');
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div><div className="page-eyebrow">Новая сверка</div><h1>Создать запуск</h1><p>Заполни период и суммы для сверки.</p></div>
        <Link className="btn btn-secondary" href="/reconciliation/history">История</Link>
      </div>
      {error ? <ApiErrorAlert error={error} title="Не удалось создать запуск" /> : null}
      <form className="card" onSubmit={submit}>
        <div className="card-header"><div className="card-title">Параметры сверки</div></div>
        <div className="form-grid">
          <div className="form-field"><label>Начало периода</label><input type="date" value={form.period_start} onChange={(e) => update('period_start', e.target.value)} required /></div>
          <div className="form-field"><label>Конец периода</label><input type="date" value={form.period_end} onChange={(e) => update('period_end', e.target.value)} required /></div>
          <div className="form-field"><label>Gateway Total RUB</label><input type="number" step="0.01" value={form.gateway_final_rub_amount} onChange={(e) => update('gateway_final_rub_amount', e.target.value)} /></div>
          <div className="form-field"><label>Gateway USDT</label><input type="number" step="0.000001" value={form.gateway_usdt_amount} onChange={(e) => update('gateway_usdt_amount', e.target.value)} /></div>
          <div className="form-field"><label>FX rate</label><input type="number" step="0.000001" value={form.fx_rate} onChange={(e) => update('fx_rate', e.target.value)} required /></div>
          <div className="form-field"><label>Conversion commission amount</label><input type="number" step="0.01" value={form.conversion_commission_amount} onChange={(e) => update('conversion_commission_amount', e.target.value)} /></div>
          <div className="form-field"><label>Conversion commission rate</label><input type="number" step="0.000001" value={form.conversion_commission_rate} onChange={(e) => update('conversion_commission_rate', e.target.value)} /></div>
          <div className="form-field"><label>WATA Base RUB</label><input type="number" step="0.01" value={form.wata_base_rub_amount} onChange={(e) => update('wata_base_rub_amount', e.target.value)} /></div>
          <div className="form-field"><label>WATA 131 RUB</label><input type="number" step="0.01" value={form.wata_131_rub_amount} onChange={(e) => update('wata_131_rub_amount', e.target.value)} /></div>
          <div className="form-field"><label>WATA Adult RUB</label><input type="number" step="0.01" value={form.wata_adult_rub_amount} onChange={(e) => update('wata_adult_rub_amount', e.target.value)} /></div>
          <div className="form-field"><label>WATA Case RUB</label><input type="number" step="0.01" value={form.wata_case_rub_amount} onChange={(e) => update('wata_case_rub_amount', e.target.value)} /></div>
        </div>
        
        <div className="actions"><button className="btn" disabled={saving}>{saving ? 'Создаю...' : 'Создать запуск'}</button></div>
      </form>
    </div>
  );
}
