"use client";

import { useState, useEffect } from 'react';
import { getCommissionGroups, updateCommissionGroup, resetCommissionGroups } from '../lib/api';
import { CommissionGroup } from '../lib/types';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(value);
}

function formatRate(value: number): string {
  return (value * 100).toFixed(2) + '%';
}

export default function CommissionsPage() {
  const [groups, setGroups] = useState<CommissionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadGroups();
  }, []);

  async function loadGroups() {
    try {
      setLoading(true);
      setError(null);
      const data = await getCommissionGroups();
      setGroups(data || []);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки ставок');
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(
    groupCode: string,
    field: keyof CommissionGroup,
    value: string
  ) {
    setGroups(prev =>
      prev.map(group =>
        group.group_code === groupCode
          ? { ...group, [field]: field === 'group_code' ? value : parseFloat(value) || 0 }
          : group
      )
    );
  }

  async function handleSave(groupCode: string) {
    const group = groups.find(g => g.group_code === groupCode);
    if (!group) return;

    try {
      setSaving(groupCode);
      setError(null);
      setSuccess(null);
      await updateCommissionGroup(group);
      setSuccess(`Ставка для ${groupCode} обновлена`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Ошибка при сохранении ставки');
    } finally {
      setSaving(null);
    }
  }

  async function handleReset() {
    if (!confirm('Вы уверены, что хотите сбросить все ставки к значениям по умолчанию?')) {
      return;
    }

    try {
      setSaving('reset');
      setError(null);
      setSuccess(null);
      await resetCommissionGroups();
      await loadGroups();
      setSuccess('Ставки сброшены к значениям по умолчанию');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Ошибка при сбросе ставок');
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <div className="container">
        <h1>Настройки ставок комиссий</h1>
        <div className="loading">Загрузка данных...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="flex justify-between items-center mb-6">
        <h1>Настройки ставок комиссий OnliPay</h1>
        <button className="secondary" onClick={handleReset} disabled={saving === 'reset'}>
          {saving === 'reset' ? 'Сброс...' : 'Сбросить к умолчанию'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success" style={{ color: 'var(--success)' }}>{success}</div>}

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Группа</th>
                <th>Ставка (Rate)</th>
                <th>Мин. комиссия (RUB)</th>
                <th>Фикс. комиссия (RUB)</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {groups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-state">Нет данных</td>
                </tr>
              ) : (
                groups.map((group) => (
                  <tr key={group.group_code}>
                    <td>
                      <input
                        type="text"
                        value={group.group_code}
                        onChange={(e) => handleInputChange(group.group_code, 'group_code', e.target.value)}
                        className="input"
                        style={{ width: '100px' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={group.rate}
                        onChange={(e) => handleInputChange(group.group_code, 'rate', e.target.value)}
                        className="input"
                        step="0.0001"
                        min="0"
                        style={{ width: '120px' }}
                      />
                      <div className="text-sm text-muted">{formatRate(group.rate)}</div>
                    </td>
                    <td>
                      <input
                        type="number"
                        value={group.min_commission}
                        onChange={(e) => handleInputChange(group.group_code, 'min_commission', e.target.value)}
                        className="input"
                        step="0.01"
                        min="0"
                        style={{ width: '120px' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={group.fixed_commission}
                        onChange={(e) => handleInputChange(group.group_code, 'fixed_commission', e.target.value)}
                        className="input"
                        step="0.01"
                        min="0"
                        style={{ width: '120px' }}
                      />
                    </td>
                    <td>
                      <button
                        className="success"
                        onClick={() => handleSave(group.group_code)}
                        disabled={saving === group.group_code}
                      >
                        {saving === group.group_code ? 'Сохранение...' : 'Сохранить'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-4 mt-4">
        <a href="/" className="secondary">← На главную</a>
      </div>
    </div>
  );
}
