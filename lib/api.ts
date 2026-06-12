import { Run, RunDetail, ReferenceRate } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function getRuns(): Promise<Run[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/reconciliation/runs`);
  if (!res.ok) throw new Error('Failed to fetch runs');
  return res.json();
}

export async function getRunDetail(runId: string): Promise<RunDetail> {
  const res = await fetch(`${API_BASE_URL}/api/v1/reconciliation/runs/${runId}`);
  if (!res.ok) throw new Error('Failed to fetch run detail');
  return res.json();
}

export async function getReferenceRates(): Promise<ReferenceRate[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/reference/onlipay-groups`);
  if (!res.ok) throw new Error('Failed to fetch reference rates');
  return res.json();
}

export async function updateReferenceRate(
  groupCode: string,
  rate: number,
  minCommission: number,
  fixedCommission: number
): Promise<void> {
  const res = await fetch(
    `${API_BASE_URL}/api/v1/reference/onlipay-groups/${groupCode}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rate,
        min_commission: minCommission,
        fixed_commission: fixedCommission,
      }),
    }
  );
  if (!res.ok) throw new Error('Failed to update reference rate');
}

export async function createRun(
  file: File,
  periodStart: string,
  periodEnd: string,
  gatewaySumWataBase: number,
  gatewaySumWata131: number,
  gatewaySumWataAdult: number,
  gatewaySumWataCase: number,
  gatewayTotalRub: number,
  conversionCommissionRate: number,
  conversionCommissionAmount: number,
  fxRate: number,
  gatewayUsdtAmount: number,
  chargebacksFile: File | null
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('period_start', periodStart);
  formData.append('period_end', periodEnd);
  formData.append('gateway_sum_wata_base', gatewaySumWataBase.toString());
  formData.append('gateway_sum_wata_131', gatewaySumWata131.toString());
  formData.append('gateway_sum_wata_adult', gatewaySumWataAdult.toString());
  formData.append('gateway_sum_wata_case', gatewaySumWataCase.toString());
  formData.append('gateway_total_rub', gatewayTotalRub.toString());
  formData.append('conversion_commission_rate', conversionCommissionRate.toString());
  formData.append('conversion_commission_amount', conversionCommissionAmount.toString());
  formData.append('fx_rate', fxRate.toString());
  formData.append('gateway_usdt_amount', gatewayUsdtAmount.toString());
  if (chargebacksFile) {
    formData.append('chargebacks_file', chargebacksFile);
  }

  const res = await fetch(`${API_BASE_URL}/api/v1/reconciliation/runs`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to create run');
  return res.json();
}