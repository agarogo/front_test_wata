const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://10.129.0.9:8055';

interface ApiError {
  message: string;
  status?: number;
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const fullUrl = `${API_BASE_URL}${url}`;
  
  const response = await fetch(fullUrl, options);
  
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
}

export async function getFrontConfig() {
  return apiFetch('/api/v1/front/config');
}

export async function getRuns() {
  return apiFetch('/api/v1/reconciliation/runs');
}

export async function getRun(id: string) {
  return apiFetch(`/api/v1/reconciliation/runs/${id}`);
}

export async function getRunCounts(id: string) {
  return apiFetch(`/api/v1/reconciliation/runs/${id}/counts`);
}

export async function createRun(formData: FormData) {
  return fetch(`${API_BASE_URL}/api/v1/reconciliation/runs`, {
    method: 'POST',
    body: formData
  }).then(async (res) => {
    if (!res.ok) {
      let error: ApiError;
      try {
        const json = await res.json();
        error = { message: json.message || 'Ошибка сервера', status: res.status };
      } catch {
        error = { message: `HTTP ${res.status}: ${res.statusText}`, status: res.status };
      }
      throw error;
    }
    return res.json();
  });
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

export async function getCommissionGroups() {
  return apiFetch('/api/v1/reference/onlipay-groups');
}

export async function updateCommissionGroup(group: { group_code: string; rate: number; min_commission: number; fixed_commission: number }) {
  return apiFetch(`/api/v1/reference/onlipay-groups/${group.group_code}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rate: group.rate,
      min_commission: group.min_commission,
      fixed_commission: group.fixed_commission
    })
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
