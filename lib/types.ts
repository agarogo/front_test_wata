export interface Run {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'accepted' | 'failed';
  period_start: string;
  period_end: string;
  created_at: string;
  usdt_difference: number;
}

export interface ReferenceRate {
  group_code: string;
  rate: number;
  min_commission: number;
  fixed_commission: number;
}

export interface RunDetail {
  id: string;
  status: string;
  period_start: string;
  period_end: string;
  gateway_sum_wata_base: number;
  gateway_sum_wata_131: number;
  gateway_sum_wata_adult: number;
  gateway_sum_wata_case: number;
  gateway_total_rub: number;
  conversion_commission_rate: number;
  conversion_commission_amount: number;
  fx_rate: number;
  gateway_usdt_amount: number;
  chargebacks_file: string;
  counts: {
    gateway_missing_current: number;
    wata_missing_current: number;
    discrepancies: number;
    resolved: number;
  };
  reference_rates: ReferenceRate[];
}