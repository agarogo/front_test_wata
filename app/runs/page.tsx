"use client";

import { useState, useEffect } from 'react';
import { getRuns, deleteRun } from '../lib/api';
import { RunSummary } from '../lib/types';

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

export default function RunsPage() {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadRuns();
  }, []);

  async function loadRuns() {
    try {
      setLoading(true);
      setError(null);
      const data = await getRuns();
      setRuns(data || []);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки запусков');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Вы уверены, что хотите удалить этот запуск?')) {
      return;
    }

    try {
      setDeletingId(id);
      await deleteRun(id);
      setRuns(prev => prev.filter(run => run.id !== id));
    } catch (err: any) {
      alert(err.message || 'Ошибка при удалении запуска');
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="container">
        <h1>Запуски сверки</h1>
        <div className="loading">Загрузка данных...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Запуски сверки</h1>

      {error && <div className="error">{error}</div>}

      <div className="card">
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
              {runs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-state">Нет запусков</td>
                </tr>
              ) : (
                runs.map((run) => (
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
                      <div className="flex gap-2 items-center">
                        <a href={`/runs/${run.id}`} className="text-sm">
                          Подробнее
                        </a>
                        <button
                          className="danger text-sm"
                          onClick={() => handleDelete(run.id)}
                          disabled={deletingId === run.id}
                        >
                          {deletingId === run.id ? 'Удаление...' : 'Удалить'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-4">
        <a href="/" className="secondary">← На главную</a>
      </div>
    </div>
  );
}
