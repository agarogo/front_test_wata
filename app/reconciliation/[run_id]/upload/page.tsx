'use client';

import { useState } from 'react';
import Link from 'next/link';
import { uploadOnliPayPayments, uploadWataPayments } from '../../../../lib/api';
import ApiErrorAlert from '../../../../components/ApiErrorAlert';

const wataSample = JSON.stringify([{ transaction_id: 'TXN001', transaction_amount: '1000', gateway_commission_rate: '0.06', conversion_commission_rate: '0', status: 'paid', transaction_type: 'payment' }], null, 2);
const onlipaySample = JSON.stringify([{ payment_id: 'PAY001', terminal_operation_number: 'TXN001', accepted_amount: '1000', status: 'success' }], null, 2);

export default function UploadPage({ params }: { params: { run_id: string } }) {
  const runId = decodeURIComponent(params.run_id);
  const [wataJson, setWataJson] = useState(wataSample);
  const [onlipayJson, setOnlipayJson] = useState(onlipaySample);
  const [group, setGroup] = useState('wata base');
  const [error, setError] = useState<unknown>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function uploadWata() {
    setLoading(true); setError(null); setMessage(null);
    try { await uploadWataPayments(runId, JSON.parse(wataJson)); setMessage('WATA данные загружены'); } catch (err) { setError(err); } finally { setLoading(false); }
  }
  async function uploadOnliPay() {
    setLoading(true); setError(null); setMessage(null);
    try { await uploadOnliPayPayments(runId, group, JSON.parse(onlipayJson)); setMessage(`OnliPay данные загружены для ${group}`); } catch (err) { setError(err); } finally { setLoading(false); }
  }

  return (
    <div className="page">
      <div className="page-header"><div><div className="page-eyebrow">Загрузка данных</div><h1>Run {runId.slice(0, 8)}</h1><p>Текущий backend принимает JSON-массивы транзакций. Excel upload можно подключить позже на backend.</p></div><Link className="btn btn-secondary" href={`/reconciliation/${runId}`}>К запуску</Link></div>
      {error ? <ApiErrorAlert error={error} title="Ошибка загрузки" /> : null}
      {message && <div className="alert"><strong>{message}</strong></div>}
      <div className="grid-2">
        <div className="card"><div className="card-header"><div className="card-title">WATA payments</div></div><textarea value={wataJson} onChange={(e) => setWataJson(e.target.value)} /><button className="btn" onClick={uploadWata} disabled={loading}>Загрузить WATA</button></div>
        <div className="card"><div className="card-header"><div className="card-title">OnliPay payments</div></div><select value={group} onChange={(e) => setGroup(e.target.value)}><option>wata base</option><option>wata 131</option><option>wata adult</option><option>wata case</option></select><textarea value={onlipayJson} onChange={(e) => setOnlipayJson(e.target.value)} /><button className="btn" onClick={uploadOnliPay} disabled={loading}>Загрузить OnliPay</button></div>
      </div>
    </div>
  );
}
