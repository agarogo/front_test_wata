'use client';

import { useCallback, useEffect, useState } from 'react';
import { getCommissionGroups, resetCommissionGroups, updateCommissionGroup } from '../../../lib/api';
import type { CommissionGroup } from '../../../lib/types';
import ApiErrorAlert from '../../../components/ApiErrorAlert';
import EmptyState from '../../../components/EmptyState';
import LoadingState from '../../../components/LoadingState';

function getGroupCode(group: CommissionGroup) { return String(group.group_code ?? group.group ?? group.group_name ?? group.label ?? ''); }
function getGroupLabel(group: CommissionGroup) { return String(group.label ?? group.group_name ?? group.group_code ?? group.group ?? '—'); }
function getGatewayPoint(group: CommissionGroup) { return String(group.gateway_point ?? '—'); }
function getRate(group: CommissionGroup) { return String(group.commission_rate ?? group.group_commission_rate ?? ''); }
function getMinCommission(group: CommissionGroup) { return String(group.min_commission ?? group.minimum_commission_amount ?? ''); }
function getFixedCommission(group: CommissionGroup) { return String(group.fixed_commission ?? group.fixed_commission_amount ?? ''); }

export default function CommissionsPage() {
  const [groups, setGroups] = useState<CommissionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingCode, setSavingCode] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Partial<CommissionGroup>>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setGroups(await getCommissionGroups());
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function updateDraft(code: string, field: keyof CommissionGroup, value: string) {
    setDrafts((prev) => ({ ...prev, [code]: { ...prev[code], [field]: value } }));
  }

  async function save(group: CommissionGroup) {
    const code = getGroupCode(group);
    setSavingCode(code);
    setError(null);
    setMessage(null);
    try {
      await updateCommissionGroup(code, drafts[code] || {});
      setMessage('Сохранено');
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setSavingCode(null);
    }
  }

  async function reset() {
    setError(null);
    setMessage(null);
    try {
      await resetCommissionGroups();
      setDrafts({});
      setMessage('Ставки сброшены');
      await load();
    } catch (err) {
      setError(err);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Справочник</div>
          <h1>Комиссии OnliPay</h1>
          <p>Ставки для групп, используемых в сверке.</p>
        </div>
        <div className="actions">
          <button className="btn btn-secondary" onClick={load}>Обновить</button>
          <button className="btn btn-primary" onClick={reset}>Сбросить</button>
        </div>
      </div>

      {error ? <ApiErrorAlert error={error} title="Ошибка справочника" onRetry={load} /> : null}
      {message && <div className="alert"><strong>{message}</strong></div>}

      <div className="card">
        {loading ? <LoadingState label="Загрузка ставок..." /> : groups.length === 0 ? <EmptyState title="Комиссии не найдены" /> : (
          <div className="table-container"><table><thead><tr><th>Код</th><th>Название</th><th>Точка</th><th>Комиссия</th><th>Минимум</th><th>Фиксированная</th><th>Действие</th></tr></thead><tbody>
            {groups.map((group) => {
              const code = getGroupCode(group);
              const draft = drafts[code] || {};
              return <tr key={code}>
                <td className="key-field">{code}</td>
                <td>{getGroupLabel(group)}</td>
                <td>{getGatewayPoint(group)}</td>
                <td><input value={String(draft.commission_rate ?? getRate(group))} onChange={(e) => updateDraft(code, 'commission_rate', e.target.value)} /></td>
                <td><input value={String(draft.min_commission ?? getMinCommission(group))} onChange={(e) => updateDraft(code, 'min_commission', e.target.value)} /></td>
                <td><input value={String(draft.fixed_commission ?? getFixedCommission(group))} onChange={(e) => updateDraft(code, 'fixed_commission', e.target.value)} /></td>
                <td><button className="btn btn-primary" onClick={() => save(group)} disabled={savingCode === code}>{savingCode === code ? 'Сохранение...' : 'Сохранить'}</button></td>
              </tr>;
            })}
          </tbody></table></div>
        )}
      </div>
    </div>
  );
}
