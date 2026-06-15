const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://10.129.0.9:5050';

interface ApiError {
  message: string;
  status?: number;
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const fullUrl = `${API_BASE_URL}${url}`;
  const timeout = 15000; // 15 seconds timeout
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(fullUrl, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      let error: ApiError;
      try {
        const json = await response.json();
        error = { message: json.message || 'Ошибка сервера', status: response.status };
      } catch {
        error = { message: `HTTP ${response.status}: ${response.statusText}`, status: response.status };
      }
      throw error;
    }
    
    // Handle empty response
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return {} as T;
    }
    
    const text = await response.text();
    if (!text.trim()) {
      return {} as T;
    }
    
    return JSON.parse(text);
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      throw { message: 'Таймаут запроса (15 сек)', status: 408 };
    }
    throw err;
  }
}

export async function getFrontConfig() {
  return apiFetch('/api/v1/front/config');
}

export async function getRuns(): Promise<unknown[]> {
  const data: unknown = await apiFetch('/api/v1/reconciliation/runs');
  
  // Handle various response formats
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'object' && data !== null && 'items' in data && Array.isArray(data.items)) return data.items;
  if (typeof data === 'object' && data !== null && 'runs' in data && Array.isArray(data.runs)) return data.runs;
  if (typeof data === 'object' && data !== null && 'data' in data && Array.isArray(data.data)) return data.data;
  
  return [];
}

export async function getRun(id: string): Promise<unknown> {
  const result = await apiFetch(`/api/v1/reconciliation/runs/${id}`);
  return result;
}

export async function getRunCounts(id: string): Promise<unknown> {
  const result = await apiFetch(`/api/v1/reconciliation/runs/${id}/counts`);
  return result;
}

export async function createRun(formData: FormData) {
  const fullUrl = `${API_BASE_URL}/api/v1/reconciliation/runs`;
  const timeout = 30000; // 30 seconds for file upload
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(fullUrl, {
      method: 'POST',
      body: formData,
      signal: controller.signal
      // Don't set Content-Type for FormData - browser sets it automatically with boundary
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      let error: ApiError;
      try {
        const json = await response.json();
        error = { message: json.message || 'Ошибка сервера', status: response.status };
      } catch {
        error = { message: `HTTP ${response.status}: ${response.statusText}`, status: response.status };
      }
      throw error;
    }
    
    return response.json();
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      throw { message: 'Таймаут загрузки файла (30 сек)', status: 408 };
    }
    throw err;
  }
}

export async function acceptRun(id: string) {
  return apiFetch(`/api/v1/reconciliation/runs/${id}/accept`, {
    method: 'POST'
  });
}

export async function deleteRun(id: string) {
  return apiFetch(`/api/v1/reconciliation/runs/${id}`, {
    method: 'DELETE'
  });
}

export async function getCommissionGroups(): Promise<unknown[]> {
  const data: unknown = await apiFetch('/api/v1/reference/onlipay-groups');
  
  // Handle various response formats
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'object' && data !== null && 'items' in data && Array.isArray(data.items)) return data.items;
  if (typeof data === 'object' && data !== null && 'groups' in data && Array.isArray(data.groups)) return data.groups;
  if (typeof data === 'object' && data !== null && 'data' in data && Array.isArray(data.data)) return data.data;
  
  return [];
}

export async function updateCommissionGroup(group_code: string, data: {
  commission_rate: string;
  min_commission: string;
  fixed_commission: string;
}) {
  return apiFetch(`/api/v1/reference/onlipay-groups/${group_code}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

export async function resetCommissionGroups() {
  return apiFetch('/api/v1/reference/onlipay-groups/reset-defaults', {
    method: 'POST'
  });
}

export function getReportXlsxUrl(id: string): string {
  return `${API_BASE_URL}/api/v1/reconciliation/runs/${id}/report.xlsx`;
}

export function getReportTxtUrl(id: string): string {
  return `${API_BASE_URL}/api/v1/reconciliation/runs/${id}/report.txt`;
}
