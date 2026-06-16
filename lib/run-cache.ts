import type { FinancialReport, ReconciliationRun, RunSummary, ReconciliationTables } from './types';

const RUNS_INDEX_KEY = 'onlipay:runs:index:v1';
const LEGACY_RUNS_INDEX_KEY = 'onlipay_reconciliation_runs';
const DETAIL_PREFIX = 'onlipay:run:detail:';
const REPORT_PREFIX = 'onlipay:run:report:';
const TABLES_PREFIX = 'onlipay:run:tables:';
const SUFFIX = ':v1';

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  try {
    const value = window.localStorage.getItem(key);
    if (!value) return fallback;
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Large tables may exceed localStorage quota. Cache must never break UI.
  }
}

export function getRunId(run: { id?: string | number; run_id?: string | number } | null | undefined): string {
  return String(run?.id ?? run?.run_id ?? '');
}

function normalizeRun(run: Partial<RunSummary> & { id?: string | number; run_id?: string | number }): RunSummary | null {
  const id = getRunId(run);
  if (!id) return null;
  return {
    ...run,
    id: run.id ?? id,
    run_id: run.run_id ?? id,
    status: run.status ?? 'pending',
  } as RunSummary;
}

function mergeRuns(primary: RunSummary[], secondary: RunSummary[]): RunSummary[] {
  const map = new Map<string, RunSummary>();
  for (const run of secondary) {
    const id = getRunId(run);
    if (id) map.set(id, run);
  }
  for (const run of primary) {
    const id = getRunId(run);
    if (id) map.set(id, { ...(map.get(id) || {}), ...run });
  }
  return Array.from(map.values()).sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || ''))).slice(0, 200);
}

export function getCachedRunIndex(): RunSummary[] {
  const current = readJson<RunSummary[]>(RUNS_INDEX_KEY, []);
  if (current.length) return current;
  const legacy = readJson<RunSummary[]>(LEGACY_RUNS_INDEX_KEY, []);
  if (legacy.length) {
    writeJson(RUNS_INDEX_KEY, legacy);
  }
  return legacy;
}

export function upsertCachedRun(run: Partial<RunSummary> & { id?: string | number; run_id?: string | number }): void {
  const normalized = normalizeRun(run);
  if (!normalized) return;
  const current = getCachedRunIndex();
  writeJson(RUNS_INDEX_KEY, mergeRuns([normalized], current));
}

export function upsertCachedRuns(runs: RunSummary[]): void {
  const normalized = runs.map((run) => normalizeRun(run)).filter(Boolean) as RunSummary[];
  if (!normalized.length) return;
  writeJson(RUNS_INDEX_KEY, mergeRuns(normalized, getCachedRunIndex()));
}

export function getCachedRunDetail(runId: string): ReconciliationRun | null {
  return readJson<ReconciliationRun | null>(`${DETAIL_PREFIX}${runId}${SUFFIX}`, null);
}

export function setCachedRunDetail(runId: string, run: ReconciliationRun): void {
  writeJson(`${DETAIL_PREFIX}${runId}${SUFFIX}`, run);
  upsertCachedRun({ ...run, id: run.id ?? runId, run_id: run.run_id ?? runId });
}

export function getCachedReport(runId: string): FinancialReport | null {
  return readJson<FinancialReport | null>(`${REPORT_PREFIX}${runId}${SUFFIX}`, null);
}

export function setCachedReport(runId: string, report: FinancialReport): void {
  writeJson(`${REPORT_PREFIX}${runId}${SUFFIX}`, report);
}

export function getCachedTables(runId: string): ReconciliationTables | null {
  return readJson<ReconciliationTables | null>(`${TABLES_PREFIX}${runId}${SUFFIX}`, null);
}

export function setCachedTables(runId: string, tables: ReconciliationTables): void {
  writeJson(`${TABLES_PREFIX}${runId}${SUFFIX}`, tables);
}

export function clearCachedRun(runId: string): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(`${DETAIL_PREFIX}${runId}${SUFFIX}`);
    window.localStorage.removeItem(`${REPORT_PREFIX}${runId}${SUFFIX}`);
    window.localStorage.removeItem(`${TABLES_PREFIX}${runId}${SUFFIX}`);
    const next = getCachedRunIndex().filter((run) => getRunId(run) !== runId);
    writeJson(RUNS_INDEX_KEY, next);
  } catch {}
}

export function mergeCachedAndRemoteRuns(remoteRuns: RunSummary[], cachedRuns = getCachedRunIndex()): RunSummary[] {
  const merged = mergeRuns(remoteRuns, cachedRuns);
  writeJson(RUNS_INDEX_KEY, merged);
  return merged;
}
