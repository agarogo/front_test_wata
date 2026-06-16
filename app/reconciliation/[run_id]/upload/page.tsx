'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { uploadOnliPayPayments, uploadWataPayments } from '../../../../lib/api';
import type { OnliPayTransaction, WataTransaction } from '../../../../lib/types';
import ApiErrorAlert from '../../../../components/ApiErrorAlert';

const groups = ['wata base', 'wata 131', 'wata adult', 'wata case'];
const wataSample = JSON.stringify([{ transaction_id: 'TXN001', transaction_amount: '1000', gateway_commission_rate: '0.06', status: 'paid', transaction_type: 'payment' }], null, 2);
const onlipaySample = JSON.stringify([{ payment_id: 'PAY001', terminal_operation_number: 'TXN001', accepted_amount: '1000', status: 'success' }], null, 2);

function parseArray<T>(value: string): T[] {
  const parsed = JSON.parse(value) as unknown;
  if (!Array.isArray(parsed)) throw new Error('Неверный формат данных');
  return parsed as T[];
}

export default function UploadPage({ params }: { params: Promise<{ run_id: string }> }) {
  const { run_id } = use(params);
  const runId = decodeURIComponent(run_id);
  const [wataJson, setWataJson] = useState(wataSample);
  const [onlipayJson, setOnlipayJson] = useState(onlipaySample);
  const [group, setGroup] = useState(groups[0]);
  const [error, setError] = useState<unknown>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function uploadWata() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const data = parseArray<WataTransaction>(wataJson);
      await uploadWataPayments(runId, data);
      setMessage('WATA данные загружены');
    } catch (err) {
      setError(err instanceof Error ? err.message : err);
    } finally {
      setLoading(false);
    }
  }

  async function uploadOnliPay() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const data = parseArray<OnliPayTransaction>(onlipayJson);
      await uploadOnliPayPayments(runId, group, data);
      setMessage(`OnliPay данные загружены для ${group}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Загрузка данных</div>
          <h1>Запуск {runId.slice(0, 8)}</h1>
          <p>Добавь данные WATA и OnliPay для выбранного запуска.</p>
        </div>
        <div className="actions">
          <Link className="btn btn-secondary" href={`/reconciliation/${runId}`}>К запуску</Link>
          <Link className="btn btn-secondary" href={`/reconciliation/${runId}/tables`}>Таблицы</Link>
        </div>
      </div>

      {error ? <ApiErrorAlert error={error} title="Ошибка загрузки" /> : null}
      {message && <div className="alert"><strong>{message}</strong></div>}

      <div className="grid-2">
        <div className="card">
          <div className="card-header"><div className="card-title">Данные WATA</div></div>
          <textarea value={wataJson} onChange={(e) => setWataJson(e.target.value)} />
          <button className="btn" onClick={uploadWata} disabled={loading}>Загрузить WATA</button>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">Данные OnliPay</div></div>
          <select value={group} onChange={(e) => setGroup(e.target.value)}>
            {groups.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <textarea value={onlipayJson} onChange={(e) => setOnlipayJson(e.target.value)} />
          <button className="btn" onClick={uploadOnliPay} disabled={loading}>Загрузить OnliPay</button>
        </div>
      </div>
    </div>
  );
}
