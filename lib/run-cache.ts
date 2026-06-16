import type { ReconciliationRun } from './types';

const RUNS_INDEX_KEY = 'onlipay:runs:index:v1';
const RUN_DETAIL_KEY_PREFIX = 'onlipay:run:detail:';
const RUN_REPORT_KEY_PREFIX = 'onlipay:run:report:';
const RUN_TABLES_KEY_PREFIX = 'onlipay:run:tables:';

function safeGetItem(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function safeStringify(value: unknown): string | null {
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

export function getRunId(run: Pick<ReconciliationRun, 'id' | 'run_id'> | null | undefined): string {
  return String(run?.id ?? run?.run_id ?? '');
}

export function getCachedRunIndex(): ReconciliationRun[] {
  const value = safeGetItem(RUNS_INDEX_KEY);
  const parsed = safeParse<ReconciliationRun[]>(value);
  return Array.isArray(parsed) ? parsed : [];
}

export function upsertCachedRun(run: Partial<ReconciliationRun> & { id?: string | number; run_id?: string | number }): void {
  const id = getRunId(run);
  if (!id) return;
  
  const current = getCachedRunIndex();
  const existingIndex = current.findIndex((r) => getRunId(r) === id);
  
  const normalized: ReconciliationRun = {
    ...run,
    id: run.id ?? run.run_id,
    run_id: run.run_id ?? run.id,
    status: run.status ?? 'pending',
    created_at: run.created_at ?? new Date().toISOString(),
  };
  
  if (existingIndex >= 0) {
    current[existingIndex] = normalized;
  } else {
    current.unshift(normalized);
  }
  
  current.slice(0, 100);
  
  const serialized = safeStringify(current);
  if (serialized) {
    safeSetItem(RUNS_INDEX_KEY, serialized);
  }
}

export function upsertCachedRuns(runs: ReconciliationRun[]): void {
  if (!Array.isArray(runs)) return;
  
  const current = getCachedRunIndex();
  const currentIds = new Set(current.map(getRunId));
  
  for (const run of runs) {
    const id = getRunId(run);
    if (!id) continue;
    
    if (!currentIds.has(id)) {
      current.unshift(run);
      currentIds.add(id);
    }
  }
  
  current.slice(0, 100);
  
  const serialized = safeStringify(current);
  if (serialized) {
    safeSetItem(RUNS_INDEX_KEY, serialized);
  }
}

export function getCachedRunDetail(runId: string): ReconciliationRun | null {
  const key = RUN_DETAIL_KEY_PREFIX + runId + ':v1';
  const value = safeGetItem(key);
  return safeParse<ReconciliationRun>(value);
}

export function setCachedRunDetail(runId: string, run: ReconciliationRun): void {
  const key = RUN_DETAIL_KEY_PREFIX + runId + ':v1';
  const serialized = safeStringify(run);
  if (serialized) {
    safeSetItem(key, serialized);
  }
}

export function getCachedReport(runId: string): unknown | null {
  const key = RUN_REPORT_KEY_PREFIX + runId + ':v1';
  const value = safeGetItem(key);
  return safeParse<unknown>(value);
}

export function setCachedReport(runId: string, report: unknown): void {
  const key = RUN_REPORT_KEY_PREFIX + runId + ':v1';
  const serialized = safeStringify(report);
  if (serialized) {
    safeSetItem(key, serialized);
  }
}

export function getCachedTables(runId: string): Record<string, unknown[]> | null {
  const key = RUN_TABLES_KEY_PREFIX + runId + ':v1';
  const value = safeGetItem(key);
  return safeParse<Record<string, unknown[]>>(value);
}

export function setCachedTables(runId: string, tables: Record<string, unknown[]>): void {
  const key = RUN_TABLES_KEY_PREFIX + runId + ':v1';
  const serialized = safeStringify(tables);
  if (serialized) {
    safeSetItem(key, serialized);
  }
}

export function clearCachedRun(runId: string): void {
  const detailKey = RUN_DETAIL_KEY_PREFIX + runId + ':v1';
  const reportKey = RUN_REPORT_KEY_PREFIX + runId + ':v1';
  const tablesKey = RUN_TABLES_KEY_PREFIX + runId + ':v1';
  
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(detailKey);
      window.localStorage.removeItem(reportKey);
      window.localStorage.removeItem(tablesKey);
    } catch {
      // ignore
    }
  }
  
  const current = getCachedRunIndex();
  const filtered = current.filter((r) => getRunId(r) !== runId);
  if (filtered.length !== current.length) {
    const serialized = safeStringify(filtered);
    if (serialized) {
      safeSetItem(RUNS_INDEX_KEY, serialized);
    }
  }
}
