import type {
  CommissionGroup,
  CreateReconciliationRunRequest,
  ExcelRunFormInput,
  FinancialReport,
  HealthResponse,
  OnliPayTransaction,
  ReconciliationRun,
  RunCounts,
  WataTransaction,
} from './types';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://10.129.0.9:5050';

export type ApiError = {
  message: string;
  status?: number;
  detail?: unknown;
  url?: string;
};

type DbCounts = Record<string, number>;

const COMMISSION_STORAGE_KEY = 'onlipay_commission_groups';

const FALLBACK_COMMISSION_GROUPS: CommissionGroup[] = [
  { group_code: 'wata base', label: 'wata base', gateway_point: 'WATA prod', commission_rate: '0.05', min_commission: '0', fixed_commission: '0' },
  { group_code: 'wata 131', label: 'wata 131', gateway_point: 'WATA prod 4', commission_rate: '0.06', min_commission: '0', fixed_commission: '0' },
  { group_code: 'wata adult', label: 'wata adult', gateway_point: 'WataAdult 1', commission_rate: '0.07', min_commission: '0', fixed_commission: '0' },
  { group_code: 'wata case', label: 'wata case', gateway_point: 'WataCase', commission_rate: '0.08', min_commission: '0', fixed_commission: '0' },
];

const rawTimeout = Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS);
export const API_TIMEOUT_MS =
  Number.isFinite(rawTimeout) && rawTimeout >= 3600000
    ? rawTimeout
    : 3600000;

function normalizeErrorPayload(payload: unknown, fallback: string): string {
  if (!payload) return fallback;
  if (typeof payload === 'string') return payload;
  if (typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const detail = record.detail;
    const message = record.message;
    if (typeof message === 'string') return message;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) return detail.map((item) => JSON.stringify(item)).join('; ');
  }
  return fallback;
}

async function apiFetch<T>(url: string, options?: RequestInit, timeout = API_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  const fullUrl = `${API_BASE_URL}${url}`;

  try {
    const response = await fetch(fullUrl, {
      ...options,
      signal: controller.signal,
      headers: options?.body instanceof FormData
        ? options.headers
        : { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    });

    const text = await response.text();
    let payload: unknown = null;
    if (text.trim()) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = text;
      }
    }

    if (!response.ok) {
      throw {
        message: normalizeErrorPayload(payload, `HTTP ${response.status}: ${response.statusText}`),
        status: response.status,
        detail: payload,
        url,
      } satisfies ApiError;
    }

    return (payload ?? {}) as T;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw { message: `Таймаут запроса. API не ответил за ${Math.round(API_TIMEOUT_MS / 60000)} минут.`, status: 408, url } satisfies ApiError;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function apiFetchFirst<T>(urls: string[], options?: RequestInit, emptyFallback?: T): Promise<T> {
  let lastError: unknown = null;
  for (const url of urls) {
    try {
      return await apiFetch<T>(url, options);
    } catch (error) {
      const status = (error as ApiError)?.status;
      lastError = error;
      if (status === 404 || status === 405 || status === 501) continue;
      throw error;
    }
  }
  if (emptyFallback !== undefined) return emptyFallback;
  throw lastError || { message: 'Не найден рабочий API endpoint' };
}

function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of ['items', 'runs', 'data', 'groups', 'results']) {
      if (Array.isArray(record[key])) return record[key] as T[];
    }
  }
  return [];
}

function readStoredCommissionGroups(): CommissionGroup[] {
  if (typeof window === 'undefined') return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(COMMISSION_STORAGE_KEY) || '[]') as CommissionGroup[];
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeStoredCommissionGroups(groups: CommissionGroup[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(COMMISSION_STORAGE_KEY, JSON.stringify(groups));
}

function normalizeCommissionGroup(item: CommissionGroup): CommissionGroup {
  const code = String(item.group_code ?? item.group ?? item.group_name ?? item.label ?? '');
  return {
    ...item,
    group_code: code,
    label: String(item.label ?? item.group_name ?? item.group ?? code),
    gateway_point: String(item.gateway_point ?? '—'),
    commission_rate: item.commission_rate ?? item.group_commission_rate ?? '0',
    min_commission: item.min_commission ?? item.minimum_commission_amount ?? '0',
    fixed_commission: item.fixed_commission ?? item.fixed_commission_amount ?? '0',
  };
}

export function getRunId(run: Pick<ReconciliationRun, 'id' | 'run_id'> | null | undefined): string {
  return String(run?.id ?? run?.run_id ?? '');
}

export async function getHealth(): Promise<HealthResponse> {
  return apiFetchFirst<HealthResponse>(['/health', '/api/health']);
}

export async function getRuns(): Promise<ReconciliationRun[]> {
  try {
    const data = await apiFetchFirst<unknown>(['/reconciliation-runs', '/api/reconciliation-runs'], undefined, []);
    return asArray<ReconciliationRun>(data);
  } catch {
    return [];
  }
}

export async function createRun(payload: CreateReconciliationRunRequest): Promise<ReconciliationRun> {
  return apiFetchFirst<ReconciliationRun>(['/reconciliation-runs/', '/api/reconciliation-runs/'], {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createRunFromExcel(input: ExcelRunFormInput): Promise<ReconciliationRun> {
  const formData = new FormData();
  formData.append('file', input.file);
  formData.append('period_start', input.period_start);
  formData.append('period_end', input.period_end);
  formData.append('fx_rate', String(input.fx_rate));
  formData.append('gateway_usdt_amount', String(input.gateway_usdt_amount));
  formData.append('gateway_final_rub_amount', String(input.gateway_final_rub_amount));
  formData.append('conversion_commission_rate', String(input.conversion_commission_rate ?? '0'));
  formData.append('conversion_commission_amount', String(input.conversion_commission_amount ?? '0'));
  formData.append('wata_base_rub_amount', String(input.wata_base_rub_amount ?? '0'));
  formData.append('wata_131_rub_amount', String(input.wata_131_rub_amount ?? '0'));
  formData.append('wata_adult_rub_amount', String(input.wata_adult_rub_amount ?? '0'));
  formData.append('wata_case_rub_amount', String(input.wata_case_rub_amount ?? '0'));

  const result = await apiFetchFirst<Record<string, unknown>>(['/reconciliation-runs/from-excel', '/api/reconciliation-runs/from-excel'], {
    method: 'POST',
    body: formData,
  }, {});

  return {
    ...result,
    id: String(result.id ?? result.run_id ?? ''),
    run_id: String(result.run_id ?? result.id ?? ''),
    status: String(result.status ?? 'calculated'),
    period_start: input.period_start,
    period_end: input.period_end,
    created_at: new Date().toISOString(),
  } as ReconciliationRun;
}

export async function getRun(runId: string): Promise<ReconciliationRun> {
  return apiFetchFirst<ReconciliationRun>([`/reconciliation-runs/${runId}`, `/api/reconciliation-runs/${runId}`]);
}

export async function getDbCounts(): Promise<DbCounts> {
  return apiFetchFirst<DbCounts>(['/reconciliation-runs/db/counts', '/api/reconciliation-runs/db/counts'], undefined, {});
}

export async function getRunCounts(runId: string): Promise<RunCounts | null> {
  try {
    const tables = await getTables(runId);
    const onlipay = tables.onlipay_payments;
    let onlipayCount = 0;
    if (Array.isArray(onlipay)) onlipayCount = onlipay.length;
    if (onlipay && typeof onlipay === 'object' && !Array.isArray(onlipay)) {
      onlipayCount = Object.values(onlipay as Record<string, unknown[]>).reduce((sum, rows) => sum + (Array.isArray(rows) ? rows.length : 0), 0);
    }
    return {
      total: (Array.isArray(tables.wata_payments) ? tables.wata_payments.length : 0) + onlipayCount,
      wata_transactions_count: Array.isArray(tables.wata_payments) ? tables.wata_payments.length : 0,
      onlipay_transactions_count: onlipayCount,
      discrepancies_count: Array.isArray(tables.amount_commission_discrepancies) ? tables.amount_commission_discrepancies.length : 0,
      missing_in_wata: Array.isArray(tables.gateway_missing_in_wata_current) ? tables.gateway_missing_in_wata_current.length : 0,
      missing_in_onlipay: Array.isArray(tables.wata_missing_in_gateway_current) ? tables.wata_missing_in_gateway_current.length : 0,
    };
  } catch {
    return null;
  }
}

export async function uploadWataPayments(runId: string, transactions: WataTransaction[]) {
  return apiFetchFirst([`/reconciliation-runs/${runId}/wata/payments`, `/api/reconciliation-runs/${runId}/wata/payments`], {
    method: 'POST',
    body: JSON.stringify(transactions),
  });
}

export async function uploadOnliPayPayments(runId: string, group: string, transactions: OnliPayTransaction[]) {
  return apiFetchFirst([
    `/reconciliation-runs/${runId}/onlipay/${encodeURIComponent(group)}/payments`,
    `/api/reconciliation-runs/${runId}/onlipay/${encodeURIComponent(group)}/payments`,
  ], {
    method: 'POST',
    body: JSON.stringify(transactions),
  });
}

export async function calculateRun(runId: string) {
  return apiFetchFirst([`/reconciliation-runs/${runId}/calculate`, `/api/reconciliation-runs/${runId}/calculate`], { method: 'POST' });
}

export async function acceptRun(runId: string) {
  return apiFetchFirst([`/reconciliation-runs/${runId}/accept`, `/api/reconciliation-runs/${runId}/accept`], { method: 'POST' });
}

export async function deleteRun(runId: string) {
  void runId;
  throw { message: 'Удаление запуска недоступно.', status: 501 } satisfies ApiError;
}

export async function getReport(runId: string): Promise<FinancialReport> {
  return apiFetchFirst<FinancialReport>([`/reconciliation-runs/${runId}/report`, `/api/reconciliation-runs/${runId}/report`]);
}

export async function getTables(runId: string): Promise<Record<string, unknown>> {
  return apiFetchFirst<Record<string, unknown>>([`/reconciliation-runs/${runId}/tables`, `/api/reconciliation-runs/${runId}/tables`], undefined, {});
}

export async function getCommissionGroups(): Promise<CommissionGroup[]> {
  const stored = readStoredCommissionGroups();
  if (stored.length) return stored.map(normalizeCommissionGroup);

  try {
    const data = await apiFetchFirst<unknown>(['/reference/onlipay-commission-rates'], undefined, []);
    const fromApi = asArray<CommissionGroup>(data).map(normalizeCommissionGroup);
    return fromApi.length ? fromApi : FALLBACK_COMMISSION_GROUPS;
  } catch {
    return FALLBACK_COMMISSION_GROUPS;
  }
}

export async function updateCommissionGroup(groupCode: string, data: Partial<CommissionGroup>) {
  const current = await getCommissionGroups();
  const next = current.map((item) => {
    const code = String(item.group_code ?? item.group ?? item.label ?? '');
    return code === groupCode ? normalizeCommissionGroup({ ...item, ...data, group_code: groupCode }) : item;
  });
  writeStoredCommissionGroups(next.length ? next : FALLBACK_COMMISSION_GROUPS);

  try {
    await apiFetch('/reference/onlipay-commission-rates', {
      method: 'POST',
      body: JSON.stringify({
        group: groupCode,
        group_commission_rate: data.commission_rate ?? data.group_commission_rate ?? '0',
        minimum_commission_amount: data.min_commission ?? data.minimum_commission_amount ?? '0',
        fixed_commission_amount: data.fixed_commission ?? data.fixed_commission_amount ?? '0',
      }),
    });
  } catch (error) {
    const status = (error as ApiError)?.status;
    if (!(status === 404 || status === 405 || status === 501)) throw error;
  }

  return { message: 'Сохранено', group_code: groupCode };
}

export async function resetCommissionGroups() {
  writeStoredCommissionGroups(FALLBACK_COMMISSION_GROUPS);
  return { message: 'Сброшено' };
}

export function getReportXlsxUrl(runId: string): string {
  return `${API_BASE_URL}/reconciliation-runs/${encodeURIComponent(runId)}/report.xlsx`;
}

export function getReportTxtUrl(runId: string): string {
  return `${API_BASE_URL}/reconciliation-runs/${encodeURIComponent(runId)}/report.txt`;
}
