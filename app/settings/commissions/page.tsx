"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCommissionGroups, updateCommissionGroup, resetCommissionGroups } from '../../../lib/api';
import { CommissionGroup } from '../../../lib/types';

function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) || 0 : value;
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(num);
}

function formatRate(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) || 0 : value;
  return (num * 100).toFixed(2) + '%';
}

export default function CommissionsPage() {
  const [groups, setGroups] = useState<CommissionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const [editForm, setEditForm] = useState<Record<string, {
    commission_rate: string;
    min_commission: string;
    fixed_commission: string;
  }>>({});

  useEffect(() => {
    loadGroups();
  }, []);

  async function loadGroups() {
    setLoading(true);
    setError(null);
    try {
      const result = await getCommissionGroups().catch(err => {
        setError(err.message || 'Ошибка загрузки ставок');
        return null;
      });
      setGroups(result ? (Array.isArray(result) ? result as CommissionGroup[] : []) : []);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(group_code: string, group: CommissionGroup) {
    setEditForm(prev => ({
      ...prev,
      [group_code]: {
        commission_rate: String(group.commission_rate),
        min_commission: String(group.min_commission),
        fixed_commission: String(group.fixed_commission)
      }
    }));
  }

  function cancelEdit(group_code: string) {
    setEditForm(prev => {
      const next = { ...prev };
      delete next[group_code];
      return next;
    });
  }

  function updateEditForm(group_code: string, field: string, value: string) {
    setEditForm(prev => ({
      ...prev,
      [group_code]: {
        ...prev[group_code],
        [field]: value
      }
    }));
  }

  async function saveEdit(group_code: string) {
    const form = editForm[group_code];
    if (!form) return;

    setSaving(true);
    setSuccess(null);
    try {
      await updateCommissionGroup(group_code, {
        commission_rate: form.commission_rate,
        min_commission: form.min_commission,
        fixed_commission: form.fixed_commission
      });
      setSuccess('Ставка обновлена');
      setEditForm(prev => {
        const next = { ...prev };
        delete next[group_code];
        return next;
      });
      await loadGroups();
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    if (!confirm('Сбросить все ставки к значениям по умолчанию?')) {
      return;
    }

    setSaving(true);
    setSuccess(null);
    try {
      await resetCommissionGroups();
      setSuccess('Ставки сброшены к значениям по умолчанию');
      await loadGroups();
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Ошибка при сбросе');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Настройка ставок комиссий OnliPay</h1>
        <Link href="/" className="secondary">← На главную</Link>
      </div>

      {error && <div className="error mb-4">{error}</div>}
      {success && <div className="success mb-4" style={{ color: 'var(--success)' }}>{success}</div>}

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Группа</th>
                <th>Gateway Point</th>
                <th>Ставка (%)</th>
                <th>Мин. комиссия (RUB)</th>
                <th>Фикс. комиссия (RUB)</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="empty-state">Загрузка ставок...</td>
                </tr>
              ) : groups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-state">Нет данных о ставках</td>
                </tr>
              ) : (
                groups.map((group) => {
                  const editing = editForm[group.group_code];
                  return (
                    <tr key={group.group_code}>
                      <td>{group.label || group.group_code}</td>
                      <td className="text-sm">{group.gateway_point}</td>
                      <td>
                        {editing ? (
                          <input
                            type="number"
                            step="0.0001"
                            value={editing.commission_rate}
                            onChange={(e) => updateEditForm(group.group_code, 'commission_rate', e.target.value)}
                            style={{ width: '100px' }}
                          />
                        ) : (
                          formatRate(group.commission_rate)
                        )}
                      </td>
                      <td>
                        {editing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editing.min_commission}
                            onChange={(e) => updateEditForm(group.group_code, 'min_commission', e.target.value)}
                            style={{ width: '100px' }}
                          />
                        ) : (
                          formatCurrency(group.min_commission)
                        )}
                      </td>
                      <td>
                        {editing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editing.fixed_commission}
                            onChange={(e) => updateEditForm(group.group_code, 'fixed_commission', e.target.value)}
                            style={{ width: '100px' }}
                          />
                        ) : (
                          formatCurrency(group.fixed_commission)
                        )}
                      </td>
                      <td>
                        {editing ? (
                          <div className="actions">
                            <button onClick={() => saveEdit(group.group_code)} disabled={saving} className="primary">
                              {saving ? 'Сохранение...' : 'Сохранить'}
                            </button>
                            <button onClick={() => cancelEdit(group.group_code)} className="secondary">
                              Отмена
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => startEdit(group.group_code, group)} className="secondary">
                            Редактировать
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <button onClick={handleReset} disabled={saving} className="danger">
          {saving ? 'Обработка...' : 'Сбросить к значениям по умолчанию'}
        </button>
      </div>

      <div className="card">
        <button onClick={loadGroups} className="secondary">
          Повторить загрузку
        </button>
      </div>

      <div className="card" style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
        <div className="card-title">Debug Info</div>
        <div>API: http://10.129.0.9:8055</div>
        <div>Hydrated: yes</div>
        <div>Groups: {groups.length} items</div>
        <div>Loading: {loading ? 'yes' : 'no'}</div>
      </div>
    </div>
  );
}
