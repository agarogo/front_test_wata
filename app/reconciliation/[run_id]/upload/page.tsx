"use client";

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import FileUploadCard from '../../components/FileUploadCard';
import EmptyState from '../../components/EmptyState';

export default function UploadPage() {
  const params = useParams();
  const runId = params.run_id as string;

  const [uploads, setUploads] = useState({
    wataPayments: false,
    onlipayWataBase: false,
    onlipayWata131: false,
    onlipayWataAdult: false,
    onlipayWataCase: false,
    refunds: false,
    chargebacks: false
  });

  function handleUploadComplete(key: string) {
    setUploads(prev => ({ ...prev, [key]: true }));
  }

  function getShortRunId(): string {
    const id = String(runId ?? "");
    return id ? id.slice(0, 8) : "—";
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Загрузка файлов: {getShortRunId()}...</h1>
        <Link href={`/reconciliation/${runId}`} className="secondary">← Назад к запуску</Link>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Информация</div>
        </div>
        <div className="card-body">
          <p>
            В текущей версии системы загрузка файлов происходит через форму создания запуска.
            Все данные загружаются одним Excel файлом при создании запуска.
          </p>
          <p>
            Для создания нового запуска с загрузкой файлов перейдите на страницу создания.
          </p>
          <Link href="/reconciliation/new" className="primary" style={{ marginTop: '1rem' }}>
            Создать новый запуск
          </Link>
        </div>
      </div>

      <EmptyState
        title="Загрузка файлов"
        description="Функциональность раздельной загрузки файлов пока не реализована"
        action={
          <Link href="/reconciliation/new" className="secondary">
            Перейти к созданию запуска
          </Link>
        }
      />

      {/* Placeholder upload cards for future implementation */}
      <div className="grid grid-2">
        <FileUploadCard
          title="WATA Payments"
          description="Загрузите файл с платежами WATA"
          uploaded={uploads.wataPayments}
          onUpload={() => handleUploadComplete('wataPayments')}
        />
        <FileUploadCard
          title="OnliPay WATA Base"
          description="Загрузите файл с платежами OnliPay WATA Base"
          uploaded={uploads.onlipayWataBase}
          onUpload={() => handleUploadComplete('onlipayWataBase')}
        />
        <FileUploadCard
          title="OnliPay WATA 131"
          description="Загрузите файл с платежами OnliPay WATA 131"
          uploaded={uploads.onlipayWata131}
          onUpload={() => handleUploadComplete('onlipayWata131')}
        />
        <FileUploadCard
          title="OnliPay WATA Adult"
          description="Загрузите файл с платежами OnliPay WATA Adult"
          uploaded={uploads.onlipayWataAdult}
          onUpload={() => handleUploadComplete('onlipayWataAdult')}
        />
        <FileUploadCard
          title="OnliPay WATA Case"
          description="Загрузите файл с платежами OnliPay WATA Case"
          uploaded={uploads.onlipayWataCase}
          onUpload={() => handleUploadComplete('onlipayWataCase')}
        />
        <FileUploadCard
          title="Refunds"
          description="Загрузите файл с возвратами (опционально)"
          uploaded={uploads.refunds}
          onUpload={() => handleUploadComplete('refunds')}
        />
        <FileUploadCard
          title="Chargebacks"
          description="Загрузите файл с чарджбеками (опционально)"
          uploaded={uploads.chargebacks}
          onUpload={() => handleUploadComplete('chargebacks')}
        />
      </div>
    </div>
  );
}
