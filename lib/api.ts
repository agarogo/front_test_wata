import type {
  CommissionGroup,
  CreateReconciliationRunRequest,
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

async function apiFetch<T>(url: string, options?: RequestInit, timeout = 15000): Promise<T> {
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
      throw { message: 'Таймаут запроса. API не ответил за 15 секунд.', status: 408, url } satisfies ApiError;
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

export function getRunId(run: Pick<ReconciliationRun, 'id' | 'run_id'> | null | undefined): string {
  return String(run?.id ?? run?.run_id ?? '');
}

export async function getHealth(): Promise<HealthResponse> {
  return apiFetchFirst<HealthResponse>(['/health', '/api/health']);
}

export async function getRuns(): Promise<ReconciliationRun[]> {
  try {
    const data = await apiFetchFirst<unknown>([
      '/api/reconciliation-runs',
      '/reconciliation-runs',
      '/api/v1/reconciliation-runs',
      '/api/v1/reconciliation/runs',
    ]);
    return asArray<ReconciliationRun>(data);
  } catch {
    // Use local list when server list is empty.
    return [];
  }
}

export async function createRun(payload: CreateReconciliationRunRequest): Promise<ReconciliationRun> {
  return apiFetchFirst<ReconciliationRun>([
    '/api/reconciliation-runs/',
    '/reconciliation-runs/',
    '/api/v1/reconciliation-runs/',
    '/api/v1/reconciliation/runs',
  ], {
    method: 'POST',
    body: JSON.stringify(payload),
  }, undefined);
}

export async function getRun(runId: string): Promise<ReconciliationRun> {
  return apiFetchFirst<ReconciliationRun>([
    `/api/reconciliation-runs/${runId}`,
    `/reconciliation-runs/${runId}`,
    `/api/v1/reconciliation-runs/${runId}`,
    `/api/v1/reconciliation/runs/${runId}`,
  ]);
}

export async function getRunCounts(runId: string): Promise<RunCounts | null> {
  try {
    return await apiFetchFirst<RunCounts>([
      `/api/v1/reconciliation/runs/${runId}/counts`,
      `/api/reconciliation-runs/${runId}/counts`,
      `/reconciliation-runs/${runId}/counts`,
    ]);
  } catch {
    return null;
  }
}

export async function uploadWataPayments(runId: string, transactions: WataTransaction[]) {
  return apiFetchFirst([
    `/api/reconciliation-runs/${runId}/wata/payments`,
    `/reconciliation-runs/${runId}/wata/payments`,
  ], { method: 'POST', body: JSON.stringify(transactions) });
}

export async function uploadOnliPayPayments(runId: string, group: string, transactions: OnliPayTransaction[]) {
  return apiFetchFirst([
    `/api/reconciliation-runs/${runId}/onlipay/${encodeURIComponent(group)}/payments`,
    `/reconciliation-runs/${runId}/onlipay/${encodeURIComponent(group)}/payments`,
  ], { method: 'POST', body: JSON.stringify(transactions) });
}

export async function calculateRun(runId: string) {
  return apiFetchFirst([
    `/api/reconciliation-runs/${runId}/calculate`,
    `/reconciliation-runs/${runId}/calculate`,
    `/api/v1/reconciliation-runs/${runId}/calculate`,
  ], { method: 'POST' });
}

export async function acceptRun(runId: string) {
  return apiFetchFirst([
    `/api/reconciliation-runs/${runId}/accept`,
    `/reconciliation-runs/${runId}/accept`,
    `/api/v1/reconciliation-runs/${runId}/accept`,
    `/api/v1/reconciliation/runs/${runId}/accept`,
  ], { method: 'POST' });
}

export async function deleteRun(runId: string) {
  void runId;
  throw { message: 'Удаление запуска недоступно.', status: 501 } satisfies ApiError;
}

export async function getReport(runId: string): Promise<FinancialReport> {
  return apiFetchFirst<FinancialReport>([
    `/api/reconciliation-runs/${runId}/report`,
    `/reconciliation-runs/${runId}/report`,
    `/api/v1/reconciliation-runs/${runId}/report`,
  ]);
}

export async function getTables(runId: string): Promise<Record<string, unknown[]>> {
  return apiFetchFirst<Record<string, unknown[]>>([
    `/api/reconciliation-runs/${runId}/tables`,
    `/reconciliation-runs/${runId}/tables`,
    `/api/v1/reconciliation-runs/${runId}/tables`,
  ], undefined, {});
}

export async function getCommissionGroups(): Promise<CommissionGroup[]> {
  const fallback: CommissionGroup[] = [
    { group_code: 'wata base', label: 'wata base', gateway_point: 'WATA prod', commission_rate: '0.05', min_commission: '—', fixed_commission: '—' },
    { group_code: 'wata 131', label: 'wata 131', gateway_point: 'WATA prod 4', commission_rate: '0.06', min_commission: '—', fixed_commission: '—' },
    { group_code: 'wata adult', label: 'wata adult', gateway_point: 'WataAdult 1', commission_rate: '0.07', min_commission: '—', fixed_commission: '—' },
    { group_code: 'wata case', label: 'wata case', gateway_point: 'WataCase', commission_rate: '0.08', min_commission: '—', fixed_commission: '—' },
  ];
  try {
    const data = await apiFetchFirst<unknown>([
      '/api/v1/reference/onlipay-groups',
      '/api/reference/onlipay-commission-rates',
      '/reference/onlipay-commission-rates',
    ]);
    const fromApi = asArray<CommissionGroup>(data);
    return fromApi.length ? fromApi : fallback;
  } catch {
    return fallback;
  }
}

export async function updateCommissionGroup(groupCode: string, data: Partial<CommissionGroup>) {
  return apiFetchFirst([
    `/api/v1/reference/onlipay-groups/${groupCode}`,
    '/api/reference/onlipay-commission-rates',
    '/reference/onlipay-commission-rates',
  ], {
    method: groupCode ? 'PUT' : 'POST',
    body: JSON.stringify({
      group: groupCode,
      group_commission_rate: data.commission_rate ?? data.group_commission_rate,
      minimum_commission_amount: data.min_commission ?? data.minimum_commission_amount,
      fixed_commission_amount: data.fixed_commission ?? data.fixed_commission_amount,
    }),
  });
}

export async function resetCommissionGroups() {
  throw { message: 'Сброс ставок недоступен.', status: 501 } satisfies ApiError;
}

export function getReportXlsxUrl(runId: string): string {
  void runId;
  return '';
}

export function getReportTxtUrl(runId: string): string {
  void runId;
  return '';
}
