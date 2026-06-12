export interface RunSummary {
  id: string;
  status: 'processing' | 'completed' | 'failed' | 'accepted';
  period_start: string;
  period_end: string;
  created_at: string;
  gateway_usdt_amount: number;
  calculated_usdt_amount: number;
  usdt_difference: number;
  gateway_total_rub: number;
  calculated_total_rub: number;
  rub_difference: number;
}

export interface RunDetail {
  id: string;
  status: string;
  period_start: string;
  period_end: string;
  created_at: string;
  gateway_sum_wata_base: number;
  gateway_sum_wata_131: number;
  gateway_sum_wata_adult: number;
  gateway_sum_wata_case: number;
  gateway_total_rub: number;
  conversion_commission_rate: number;
  conversion_commission_amount: number;
  fx_rate: number;
  gateway_usdt_amount: number;
  calculated_usdt_amount: number;
  calculated_total_rub: number;
  chargebacks_file?: string;
  usdt_difference: number;
  rub_difference: number;
}

export interface RunCounts {
  total: number;
  matched: number;
  unmatched_gateway: number;
  unmatched_onlipay: number;
}

export interface CommissionGroup {
  group_code: string;
  label: string;
  gateway_point: string;
  commission_rate: string;
  min_commission: string;
  fixed_commission: string;
  updated_at?: string | null;
}

export interface FrontConfig {
  style: {
    theme: {
      mode: string;
      colors: Record<string, string>;
    };
  };
  ui_structure: {
    pages: Array<{
      route: string;
      name: string;
      blocks: string[];
    }>;
  };
}

export interface CreateRunFormData {
  file: File;
  period_start: string;
  period_end: string;
  gateway_sum_wata_base?: number;
  gateway_sum_wata_131?: number;
  gateway_sum_wata_adult?: number;
  gateway_sum_wata_case?: number;
  gateway_total_rub?: number;
  conversion_commission_rate?: number;
  conversion_commission_amount?: number;
  fx_rate: number;
  gateway_usdt_amount: number;
  chargebacks_file?: File;
}
