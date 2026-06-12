"use client";

import { useState, useEffect } from 'react';
import { getCommissionGroups, updateCommissionGroup, resetCommissionGroups } from '../../../lib/api';
import { CommissionGroup } from '../../../lib/types';

function formatRate(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) || 0 : value;
  return (num * 100).toFixed(2) + '%';
}

function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) || 0 : value;
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(num);
}

function formatDate(dateStr: string | null | undefined): string {
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

export default function CommissionsPage() {
  const [groups, setGroups] = useState<CommissionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  const [editData, setEditData] = useState<Record<string, Partial<CommissionGroup>>>({});

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

  function handleEdit(group_code: string) {
    setEditData(prev => ({
      ...prev,
      [group_code]: groups.find(g => g.group_code === group_code) || {}
    }));
  }

  function handleCancel(group_code: string) {
    setEditData(prev => {
      const next = { ...prev };
      delete next[group_code];
      return next;
    });
  }

  function handleInputChange(
    group_code: string,
    field: keyof CommissionGroup,
    value: string
  ) {
    setEditData(prev => ({
      ...prev,
      [group_code]: {
        ...prev[group_code],
        [field]: value
      }
    }));
  }

  async function handleSave(group_code: string) {
    const data = editData[group_code];
    if (!data) return;

    const commission_rate = data.commission_rate || '';
    const min_commission = data.min_commission || '';
    const fixed_commission = data.fixed_commission || '';

    if (!commission_rate || !min_commission || !fixed_commission) {
      alert('Заполните все поля');
      return;
    }

    try {
      setSavingId(group_code);
      await updateCommissionGroup(group_code, {
        commission_rate,
        min_commission,
        fixed_commission
      });
      await loadGroups();
      setEditData(prev => {
        const next = { ...prev };
        delete next[group_code];
        return next;
      });
    } catch (err: any) {
      alert(err.message || 'Ошибка при сохранении');
    } finally {
      setSavingId(null);
    }
  }

  async function handleReset() {
    if (!confirm('Сбросить все ставки к значениям по умолчанию?')) {
      return;
    }

    try {
      setResetting(true);
      await resetCommissionGroups();
      await loadGroups();
      alert('Ставки успешно сброшены');
    } catch (err: any) {
      alert(err.message || 'Ошибка при сбросе ставок');
    } finally {
      setResetting(false);
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="flex justify-between items-center mb-6">
          <h1>Настройка ставок комиссий</h1>
          <a href="/" className="secondary">← На главную</a>
        </div>
        <div className="loading">Загрузка данных...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="flex justify-between items-center mb-6">
        <h1>Настройка ставок комиссий OnliPay</h1>
        <div className="flex gap-2">
          <a href="/" className="secondary">← На главную</a>
          <button
            className="danger"
            onClick={handleReset}
            disabled={resetting}
          >
            {resetting ? 'Сброс...' : 'Сбросить все'}
          </button>
        </div>
      </div>

      {error && <div className="error mb-4">{error}</div>}

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Группа</th>
                <th>Gateway Point</th>
                <th>Ставка комиссии</th>
                <th>Мин. комиссия</th>
                <th>Фикс. комиссия</th>
                <th>Обновлено</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {groups.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-state">Нет данных о ставках</td>
                </tr>
              ) : (
                groups.map((group) => {
                  const isEditing = editData[group.group_code] !== undefined;
                  const edit = editData[group.group_code] || group;

                  return (
                    <tr key={group.group_code}>
                      <td className="font-medium">{group.label || group.group_code}</td>
                      <td className="text-sm">{group.gateway_point}</td>
                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            value={edit.commission_rate || ''}
                            onChange={(e) => handleInputChange(group.group_code, 'commission_rate', e.target.value)}
                            step="0.0001"
                            className="input"
                          />
                        ) : (
                          formatRate(group.commission_rate)
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            value={edit.min_commission || ''}
                            onChange={(e) => handleInputChange(group.group_code, 'min_commission', e.target.value)}
                            step="0.01"
                            className="input"
                          />
                        ) : (
                          formatCurrency(group.min_commission)
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            value={edit.fixed_commission || ''}
                            onChange={(e) => handleInputChange(group.group_code, 'fixed_commission', e.target.value)}
                            step="0.01"
                            className="input"
                          />
                        ) : (
                          formatCurrency(group.fixed_commission)
                        )}
                      </td>
                      <td className="text-sm">{formatDate(group.updated_at)}</td>
                      <td>
                        {isEditing ? (
                          <div className="flex gap-2">
                            <button
                              className="primary text-sm"
                              onClick={() => handleSave(group.group_code)}
                              disabled={savingId === group.group_code}
                            >
                              {savingId === group.group_code ? 'Сохранение...' : 'Сохранить'}
                            </button>
                            <button
                              className="secondary text-sm"
                              onClick={() => handleCancel(group.group_code)}
                            >
                              Отмена
                            </button>
                          </div>
                        ) : (
                          <button
                            className="text-sm"
                            onClick={() => handleEdit(group.group_code)}
                          >
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
    </div>
  );
}
