'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createRunFromExcel, getRunId } from '../../../lib/api';
import { setCachedRunDetail, upsertCachedRun } from '../../../lib/run-cache';
import ApiErrorAlert from '../../../components/ApiErrorAlert';

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

type FormKey = keyof typeof initialForm;

export default function NewReconciliationPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [mode, setMode] = useState<'excel' | 'database'>('excel');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);

  function update(field: FormKey, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate() {
    if (!form.period_start || !form.period_end) return 'Укажи начало и конец периода.';
    if (new Date(form.period_end) < new Date(form.period_start)) return 'Конец периода не может быть раньше начала.';
    if (Number(form.fx_rate) <= 0) return 'Курс валюты должен быть больше 0.';
    if (Number(form.gateway_usdt_amount) < 0) return 'Gateway USDT не может быть меньше 0.';
    if (Number(form.gateway_final_rub_amount) < 0) return 'Gateway RUB не может быть меньше 0.';
    if (Number(form.conversion_commission_rate) < 0) return 'Комиссия конвертации не может быть меньше 0.';
    if (Number(form.conversion_commission_amount) < 0) return 'Сумма комиссии не может быть меньше 0.';
    if (mode === 'excel' && !file) return 'Выбери Excel файл.';
    if (file && !file.name.toLowerCase().endsWith('.xlsx')) return 'Файл должен быть .xlsx.';
    return null;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    try {
      const run = await createRunFromExcel({
        file: mode === 'excel' ? file : null,
        period_start: form.period_start,
        period_end: form.period_end,
        gateway_final_rub_amount: form.gateway_final_rub_amount || '0',
        fx_rate: form.fx_rate,
        gateway_usdt_amount: form.gateway_usdt_amount || '0',
        conversion_commission_rate: form.conversion_commission_rate || '0',
        conversion_commission_amount: form.conversion_commission_amount || '0',
        wata_base_rub_amount: form.wata_base_rub_amount || '0',
        wata_131_rub_amount: form.wata_131_rub_amount || '0',
        wata_adult_rub_amount: form.wata_adult_rub_amount || '0',
        wata_case_rub_amount: form.wata_case_rub_amount || '0',
      });
      const id = getRunId(run);
      upsertCachedRun({
        ...run,
        id,
        run_id: id,
        period_start: run.period_start || form.period_start,
        period_end: run.period_end || form.period_end,
        status: run.status || 'calculated',
      });
      if (id) setCachedRunDetail(id, run);
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
        <div>
          <div className="page-eyebrow">Новая сверка</div>
          <h1>Создать расчёт</h1>
          <p>Заполни период и суммы. Можно загрузить Excel или посчитать по данным в БД.</p>
        </div>
        <Link className="btn btn-secondary" href="/reconciliation/history">История</Link>
      </div>

      {error ? <ApiErrorAlert error={error} title="Не удалось создать запуск" /> : null}

      <form className="card" onSubmit={submit}>
        <div className="card-header"><div className="card-title">Параметры сверки</div></div>

        <div className="grid-2">
          <label className="upload-card">
            <input type="radio" checked={mode === 'excel'} onChange={() => setMode('excel')} />
            <span><strong>Upload Excel</strong><br /><small className="muted">Загрузить новый Excel</small></span>
          </label>
          <label className="upload-card">
            <input type="radio" checked={mode === 'database'} onChange={() => setMode('database')} />
            <span><strong>Use DB</strong><br /><small className="muted">Посчитать из БД без загрузки файла</small></span>
          </label>
        </div>

        {mode === 'database' ? <div className="alert"><strong>Расчёт будет выполнен из уже сохранённых данных в БД за выбранный период.</strong></div> : null}

        <div className="grid-2">
          <div className="card">
            <div className="card-title">Период</div>
            <div className="form-grid">
              <div className="form-field"><label>Начало периода</label><input type="date" value={form.period_start} onChange={(e) => update('period_start', e.target.value)} required /></div>
              <div className="form-field"><label>Конец периода</label><input type="date" value={form.period_end} onChange={(e) => update('period_end', e.target.value)} required /></div>
            </div>
          </div>

          {mode === 'excel' ? (
            <div className="card">
              <div className="card-title">Файл реестра</div>
              <div className="form-field">
                <label>Файл .xlsx</label>
                <input type="file" accept=".xlsx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required={mode === 'excel'} />
              </div>
            </div>
          ) : null}
        </div>

        <div className="card">
          <div className="card-title">Суммы OnliPay</div>
          <div className="form-grid">
            <div className="form-field"><label>Gateway final RUB amount</label><input type="number" step="0.01" min="0" value={form.gateway_final_rub_amount} onChange={(e) => update('gateway_final_rub_amount', e.target.value)} required /></div>
            <div className="form-field"><label>Gateway USDT amount</label><input type="number" step="0.000001" min="0" value={form.gateway_usdt_amount} onChange={(e) => update('gateway_usdt_amount', e.target.value)} required /></div>
            <div className="form-field"><label>FX rate</label><input type="number" step="0.000001" min="0" value={form.fx_rate} onChange={(e) => update('fx_rate', e.target.value)} required /></div>
            <div className="form-field"><label>Conversion commission amount</label><input type="number" step="0.01" min="0" value={form.conversion_commission_amount} onChange={(e) => update('conversion_commission_amount', e.target.value)} required /></div>
            <div className="form-field"><label>Conversion commission rate</label><input type="number" step="0.000001" min="0" value={form.conversion_commission_rate} onChange={(e) => update('conversion_commission_rate', e.target.value)} required /></div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Суммы WATA по группам</div>
          <div className="form-grid">
            <div className="form-field"><label>WATA Base RUB</label><input type="number" step="0.01" min="0" value={form.wata_base_rub_amount} onChange={(e) => update('wata_base_rub_amount', e.target.value)} /></div>
            <div className="form-field"><label>WATA 131 RUB</label><input type="number" step="0.01" min="0" value={form.wata_131_rub_amount} onChange={(e) => update('wata_131_rub_amount', e.target.value)} /></div>
            <div className="form-field"><label>WATA Adult RUB</label><input type="number" step="0.01" min="0" value={form.wata_adult_rub_amount} onChange={(e) => update('wata_adult_rub_amount', e.target.value)} /></div>
            <div className="form-field"><label>WATA Case RUB</label><input type="number" step="0.01" min="0" value={form.wata_case_rub_amount} onChange={(e) => update('wata_case_rub_amount', e.target.value)} /></div>
          </div>
        </div>

        <div className="actions"><button className="btn" disabled={saving}>{saving ? 'Запускаю...' : 'Запустить сверку'}</button></div>
      </form>
    </div>
  );
}
