export async function getFrontConfig() {
  return fetch('/api/v1/front/config').then(res => res.json())
}

export async function getRuns() {
  return fetch('/api/v1/reconciliation/runs').then(res => res.json())
}

export async function getRun(id: string) {
  return fetch(`/api/v1/reconciliation/runs/${id}`).then(res => res.json())
}

export async function getRunCounts(id: string) {
  return fetch(`/api/v1/reconciliation/runs/${id}/counts`).then(res => res.json())
}

export async function createRun(data: any) {
  return fetch('/api/v1/reconciliation/runs', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(data)
  }).then(res => res.json())
}

export async function acceptRun(id: string) {
  return fetch(`/api/v1/reconciliation/runs/${id}/accept`, {
    method: 'POST'
  }).then(res => res.json())
}

export async function deleteRun(id: string) {
  return fetch(`/api/v1/reconciliation/runs/${id}`, {
    method: 'DELETE'
  }).then(res => res.json())
}

export async function getCommissionGroups() {
  return fetch('/api/v1/reference/onlipay-groups').then(res => res.json())
}

export async function updateCommissionGroup(id: string, data: any) {
  return fetch(`/api/v1/reference/onlipay-groups/${id}`, {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(data)
  }).then(res => res.json())
}

export async function resetCommissionGroups() {
  return fetch('/api/v1/reference/onlipay-groups/reset', {
    method: 'POST'
  }).then(res => res.json())
}

export async function getReportXlsxUrl(id: string) {
  return fetch(`/api/v1/reconciliation/runs/${id}/report.xlsx`).then(res => res.json())
}

export async function getReportTxtUrl(id: string) {
  return fetch(`/api/v1/reconciliation/runs/${id}/report.txt`).then(res => res.json())
}