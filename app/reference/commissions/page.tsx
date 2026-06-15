'use client';

import { useCallback, useEffect, useState } from 'react';
import { getCommissionGroups, resetCommissionGroups, updateCommissionGroup } from '../../../lib/api';
import type { CommissionGroup } from '../../../lib/types';
import ApiErrorAlert from '../../../components/ApiErrorAlert';
import EmptyState from '../../../components/EmptyState';
import LoadingState from '../../../components/LoadingState';

function getCode(group: CommissionGroup) { return String(group.group_code ?? group.group ?? group.group_name ?? ''); }
function getRate(group: CommissionGroup) { return String(group.commission_rate ?? group.group_commission_rate ?? ''); }

export default function CommissionsPage() {
  const [groups, setGroups] = useState<CommissionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Partial<CommissionGroup>>>({});

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setGroups(await getCommissionGroups()); } catch (err) { setError(err); } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function updateDraft(code: string, field: keyof CommissionGroup, value: string) {
    setDrafts((prev) => ({ ...prev, [code]: { ...prev[code], [field]: value } }));
  }

  async function save(group: CommissionGroup) {
    const code = getCode(group);
    setSaving(true); setError(null); setMessage(null);
    try { await updateCommissionGroup(code, drafts[code] || {}); setMessage('Ставка отправлена в backend'); await load(); } catch (err) { setError(err); } finally { setSaving(false); }
  }

  async function reset() {
    setSaving(true); setError(null); setMessage(null);
    try { await resetCommissionGroups(); setMessage('Ставки сброшены'); await load(); } catch (err) { setError(err); } finally { setSaving(false); }
  }

  return (
    <div className="page">
      <div className="page-header"><div><div className="page-eyebrow">Справочник</div><h1>Комиссии OnliPay</h1><p>Backend может пока возвращать fallback-значения или 501 для сохранения. Ошибка будет показана явно.</p></div><button className="btn btn-secondary" onClick={reset} disabled={saving}>Сбросить</button></div>
      {error ? <ApiErrorAlert error={error} title="Ошибка справочника" onRetry={load} /> : null}
      {message && <div className="alert"><strong>{message}</strong></div>}
      <div className="card">
        {loading ? <LoadingState label="Загрузка ставок..." /> : groups.length === 0 ? <EmptyState title="Ставки не найдены" /> : (
          <div className="table-container"><table><thead><tr><th>Группа</th><th>Gateway point</th><th>Ставка</th><th>Минимум</th><th>Фикс.</th><th>Действия</th></tr></thead><tbody>
            {groups.map((group) => {
              const code = getCode(group);
              const draft = drafts[code] || {};
              return <tr key={code}>
                <td className="key-field">{group.label || code}</td>
                <td>{group.gateway_point || '—'}</td>
                <td><input value={String(draft.commission_rate ?? getRate(group))} onChange={(e) => updateDraft(code, 'commission_rate', e.target.value)} /></td>
                <td><input value={String(draft.min_commission ?? group.min_commission ?? group.minimum_commission_amount ?? '')} onChange={(e) => updateDraft(code, 'min_commission', e.target.value)} /></td>
                <td><input value={String(draft.fixed_commission ?? group.fixed_commission ?? group.fixed_commission_amount ?? '')} onChange={(e) => updateDraft(code, 'fixed_commission', e.target.value)} /></td>
                <td><button className="btn btn-secondary" onClick={() => save(group)} disabled={saving}>Сохранить</button></td>
              </tr>;
            })}
          </tbody></table></div>
        )}
      </div>
    </div>
  );
}
