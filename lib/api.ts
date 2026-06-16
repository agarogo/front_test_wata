import type {
  CommissionGroup,
  CreateReconciliationRunRequest,
  ExcelRunFormInput,
  FinancialReport,
  HealthResponse,
  OnliPayTransaction,
  ReconciliationRun,
  ReconciliationTables,
  WataTransaction,
} from './types';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://10.129.0.9:5050';

export type ApiError = {
  message: string;
  status?: number;
  detail?: unknown;
  url?: string;
};

const rawTimeout = Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS);
export const API_TIMEOUT_MS = Number.isFinite(rawTimeout) && rawTimeout >= 3600000 ? rawTimeout : 3600000;

const COMMISSION_STORAGE_KEY = 'onlipay_commission_groups';

const FALLBACK_COMMISSION_GROUPS: CommissionGroup[] = [
  { group_code: 'wata base', label: 'wata base', gateway_point: 'WATA prod', commission_rate: '0.05', min_commission: '0', fixed_commission: '0' },
  { group_code: 'wata 131', label: 'wata 131', gateway_point: 'WATA prod 4', commission_rate: '0.06', min_commission: '0', fixed_commission: '0' },
  { group_code: 'wata adult', label: 'wata adult', gateway_point: 'WataAdult 1', commission_rate: '0.07', min_commission: '0', fixed_commission: '0' },
  { group_code: 'wata case', label: 'wata case', gateway_point: 'WataCase', commission_rate: '0.08', min_commission: '0', fixed_commission: '0' },
];

function normalizeErrorPayload(payload: unknown, fallback: string): string {
  if (!payload) return fallback;
  if (typeof payload === 'string') return payload;
  if (typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (typeof record.message === 'string') return record.message;
    if (typeof record.detail === 'string') return record.detail;
    if (Array.isArray(record.detail)) return record.detail.map((item) => JSON.stringify(item)).join('; ');
  }
  return fallback;
}

async function parseResponse<T>(response: Response, url: string): Promise<T> {
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
}

async function apiFetch<T>(url: string, options?: RequestInit, timeout = API_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  const fullUrl = `${API_BASE_URL}${url}`;

  try {
    const headers = options?.body instanceof FormData
      ? options.headers
      : { 'Content-Type': 'application/json', ...(options?.headers || {}) };
    const response = await fetch(fullUrl, { ...options, signal: controller.signal, headers });
    return await parseResponse<T>(response, url);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw { message: `Запрос выполнялся слишком долго. Таймаут: ${Math.round(API_TIMEOUT_MS / 60000)} минут.`, status: 408, url } satisfies ApiError;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
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
  try {
    window.localStorage.setItem(COMMISSION_STORAGE_KEY, JSON.stringify(groups));
  } catch {}
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

export function getRunId(run: { id?: string | number; run_id?: string | number } | null | undefined): string {
  return String(run?.id ?? run?.run_id ?? '');
}

function normalizeCreatedRun(result: Record<string, unknown>, input: Partial<ExcelRunFormInput> = {}): ReconciliationRun {
  const id = String(result.run_id ?? result.id ?? '');
  const financialReport = result.financial_report && typeof result.financial_report === 'object'
    ? result.financial_report as Record<string, unknown>
    : undefined;
  return {
    ...result,
    id,
    run_id: id,
    status: String(result.status ?? 'calculated'),
    period_start: String(result.period_start ?? financialReport?.period_start ?? input.period_start ?? ''),
    period_end: String(result.period_end ?? financialReport?.period_end ?? input.period_end ?? ''),
    created_at: String(result.created_at ?? new Date().toISOString()),
  } as ReconciliationRun;
}

export async function getHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>('/health');
}

export async function getRuns(): Promise<ReconciliationRun[]> {
  try {
    const data = await apiFetch<unknown>('/reconciliation-runs');
    return asArray<ReconciliationRun>(data);
  } catch (error) {
    const status = (error as ApiError)?.status;
    if (status === 404 || status === 405 || status === 501) return [];
    return [];
  }
}

export async function createRun(payload: CreateReconciliationRunRequest): Promise<ReconciliationRun> {
  const result = await apiFetch<Record<string, unknown>>('/reconciliation-runs/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return normalizeCreatedRun(result, payload);
}

export async function createRunFromExcel(input: ExcelRunFormInput): Promise<ReconciliationRun> {
  const formData = new FormData();
  if (input.file) formData.append('file', input.file);
  formData.append('period_start', input.period_start);
  formData.append('period_end', input.period_end);
  formData.append('fx_rate', String(input.fx_rate));
  formData.append('gateway_usdt_amount', String(input.gateway_usdt_amount));
  formData.append('gateway_final_rub_amount', String(input.gateway_final_rub_amount));
  formData.append('conversion_commission_rate', String(input.conversion_commission_rate ?? '0'));
  formData.append('conversion_commission_amount', String(input.conversion_commission_amount ?? '0'));
  if (input.wata_base_rub_amount !== undefined) formData.append('wata_base_rub_amount', String(input.wata_base_rub_amount));
  if (input.wata_131_rub_amount !== undefined) formData.append('wata_131_rub_amount', String(input.wata_131_rub_amount));
  if (input.wata_adult_rub_amount !== undefined) formData.append('wata_adult_rub_amount', String(input.wata_adult_rub_amount));
  if (input.wata_case_rub_amount !== undefined) formData.append('wata_case_rub_amount', String(input.wata_case_rub_amount));

  const result = await apiFetch<Record<string, unknown>>('/reconciliation-runs/from-excel', {
    method: 'POST',
    body: formData,
  });
  return normalizeCreatedRun(result, input);
}

export async function getRun(runId: string): Promise<ReconciliationRun> {
  return apiFetch<ReconciliationRun>(`/reconciliation-runs/${encodeURIComponent(runId)}`);
}

export async function getDbCounts(): Promise<Record<string, number>> {
  try {
    return await apiFetch<Record<string, number>>('/reconciliation-runs/db/counts');
  } catch {
    return {};
  }
}

export async function uploadWataPayments(runId: string, transactions: WataTransaction[]) {
  return apiFetch(`/reconciliation-runs/${encodeURIComponent(runId)}/wata/payments`, {
    method: 'POST',
    body: JSON.stringify(transactions),
  });
}

export async function uploadOnliPayPayments(runId: string, group: string, transactions: OnliPayTransaction[]) {
  return apiFetch(`/reconciliation-runs/${encodeURIComponent(runId)}/onlipay/${encodeURIComponent(group)}/payments`, {
    method: 'POST',
    body: JSON.stringify(transactions),
  });
}

export async function calculateRun(runId: string) {
  return apiFetch(`/reconciliation-runs/${encodeURIComponent(runId)}/calculate`, { method: 'POST' });
}

export async function acceptRun(runId: string) {
  return apiFetch(`/reconciliation-runs/${encodeURIComponent(runId)}/accept`, { method: 'POST' });
}

export async function deleteRun(runId: string) {
  void runId;
  throw { message: 'Удаление запуска недоступно.', status: 501 } satisfies ApiError;
}

export async function getReport(runId: string): Promise<FinancialReport> {
  return apiFetch<FinancialReport>(`/reconciliation-runs/${encodeURIComponent(runId)}/report`);
}

export async function getTables(runId: string): Promise<ReconciliationTables> {
  return apiFetch<ReconciliationTables>(`/reconciliation-runs/${encodeURIComponent(runId)}/tables`);
}

export async function getCommissionGroups(): Promise<CommissionGroup[]> {
  const stored = readStoredCommissionGroups();
  if (stored.length) return stored.map(normalizeCommissionGroup);

  try {
    const data = await apiFetch<unknown>('/reference/onlipay-commission-rates', { method: 'POST', body: JSON.stringify({}) });
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
