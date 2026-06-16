export type ID = string | number;

export interface ApiErrorShape {
  message: string;
  status?: number;
  detail?: unknown;
  url?: string;
}

export interface HealthResponse {
  status?: string;
  service?: string;
  version?: string;
  timestamp?: string;
}

export type DataSource = 'excel_upload' | 'linked_run' | 'database_period' | string;

export type ParsedCounts = {
  wata_payments?: number;
  carry_over_payments?: number;
  onlipay_wata_base?: number;
  onlipay_wata_131?: number;
  onlipay_wata_adult?: number;
  onlipay_wata_case?: number;
  gateway_refunds?: number;
  chargebacks?: number;
  [key: string]: number | undefined;
};

export type DbCounts = {
  reconciliation_runs?: number;
  wata_transactions?: number;
  onlipay_transactions?: number;
  run_items?: number;
  [key: string]: number | undefined;
};

export interface FinancialReport {
  run_id?: string;
  period_start?: string;
  period_end?: string;
  fx_rate?: string | number;
  gateway_usdt_amount?: string | number;
  conversion_commission_amount?: string | number;
  amount_8_1?: string | number;
  gateway_missing_in_wata_current?: string | number;
  gateway_missing_in_wata_current_total?: string | number;
  wata_missing_in_gateway_current?: string | number;
  wata_missing_in_gateway_current_total?: string | number;
  amount_commission_discrepancies_total?: string | number;
  preliminary_rub_amount?: string | number;
  final_rub_amount?: string | number;
  calculated_usdt_amount?: string | number;
  usdt_difference?: string | number;
  discrepancies_count?: number;
  [key: string]: unknown;
}

export interface ReconciliationRun {
  id?: ID;
  run_id?: ID;
  status?: string;
  period_start?: string;
  period_end?: string;
  created_at?: string;
  updated_at?: string;
  data_source?: DataSource;
  source_run_id?: string | null;
  gateway_final_rub_amount?: string | number;
  fx_rate?: string | number;
  gateway_usdt_amount?: string | number;
  calculated_usdt_amount?: string | number;
  usdt_difference?: string | number;
  final_rub_amount?: string | number;
  preliminary_rub_amount?: string | number;
  discrepancies_count?: number;
  parsed_counts?: ParsedCounts;
  db_counts?: DbCounts;
  financial_report?: FinancialReport;
  missing_counts?: Record<string, unknown>;
  report_downloads?: { xlsx?: string; txt?: string };
  warnings?: string[];
  [key: string]: unknown;
}

export type RunSummary = ReconciliationRun;
export type RunDetail = ReconciliationRun;

export interface ReconciliationUploadResponse extends ReconciliationRun {
  run_id: string;
  status: string;
  data_source?: DataSource;
  source_run_id?: string | null;
  parsed_counts?: ParsedCounts;
  db_counts?: DbCounts;
  financial_report?: FinancialReport;
  missing_counts?: Record<string, unknown>;
  discrepancies_count?: number;
  report_downloads?: { xlsx?: string; txt?: string };
  warnings?: string[];
}

export interface RunCounts {
  total?: number;
  matched?: number;
  unmatched_gateway?: number;
  unmatched_onlipay?: number;
  wata_transactions_count?: number;
  onlipay_transactions_count?: number;
  carry_over_count?: number;
  onlipay_base_count?: number;
  onlipay_131_count?: number;
  onlipay_adult_count?: number;
  onlipay_case_count?: number;
  matched_count?: number;
  discrepancies_count?: number;
  missing_in_wata?: number;
  missing_in_onlipay?: number;
}

export interface CreateReconciliationRunRequest {
  period_start: string;
  period_end: string;
  gateway_group_rub_amounts: Record<string, string | number>;
  gateway_final_rub_amount: string | number;
  fx_rate: string | number;
  gateway_usdt_amount: string | number;
  conversion_commission_rate: string | number;
  conversion_commission_amount: string | number;
}

export interface ExcelRunFormInput {
  file?: File | null;
  period_start: string;
  period_end: string;
  gateway_final_rub_amount: string | number;
  fx_rate: string | number;
  gateway_usdt_amount: string | number;
  conversion_commission_rate?: string | number;
  conversion_commission_amount?: string | number;
  wata_base_rub_amount?: string | number;
  wata_131_rub_amount?: string | number;
  wata_adult_rub_amount?: string | number;
  wata_case_rub_amount?: string | number;
}

export interface WataTransaction {
  transaction_id?: string;
  transaction_datetime?: string;
  product?: string;
  merchant_id?: string;
  merchant_name?: string;
  terminal_id?: string;
  terminal_name?: string;
  payment_type?: string;
  currency?: string;
  status?: string;
  transaction_type?: string;
  transaction_amount?: string | number;
  merchant_commission_amount?: string | number;
  gateway_commission_rate?: string | number;
  gateway_transaction_id?: string;
  gateway_name?: string;
  [key: string]: unknown;
}

export interface OnliPayTransaction {
  payment_id?: string;
  id_payment?: string;
  gateway_transaction_id?: string;
  server_datetime?: string;
  server_time?: string;
  status?: string;
  substatus?: string;
  operation_number?: string;
  terminal_operation_number?: string;
  service?: string;
  point_name?: string;
  point?: string;
  point_id?: string;
  accepted_amount?: string | number;
  credited_amount?: string | number;
  client_commission?: string | number;
  cash_amount?: string | number;
  provider_currency_amount?: string | number;
  provider_transaction?: string;
  [key: string]: unknown;
}

export type ReconciliationTables = Record<string, unknown>;
export type RunTables = Record<string, unknown>;

export interface CommissionGroup {
  group_code?: string;
  group?: string;
  group_name?: string;
  label?: string;
  gateway_point?: string;
  commission_rate?: string | number;
  group_commission_rate?: string | number;
  min_commission?: string | number;
  minimum_commission_amount?: string | number;
  fixed_commission?: string | number;
  fixed_commission_amount?: string | number;
  is_active?: boolean;
  updated_at?: string | null;
}

export interface CreateRunFormData {
  file?: File;
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
