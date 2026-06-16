'use client';

import { useMemo, useState, type ReactNode } from 'react';
import EmptyState from './EmptyState';
import StatusBadge from './StatusBadge';

type Row = Record<string, unknown>;

export type Column<T extends Row> = {
  key: keyof T | string;
  header: string;
  render?: (value: unknown, row: T) => ReactNode;
};

function formatCell(value: unknown, key: string) {
  if (value === null || value === undefined || value === '') return '—';
  if (key.toLowerCase().includes('amount') || key.toLowerCase().includes('sum')) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (key.toLowerCase().includes('date') || key.toLowerCase().includes('time')) {
    return String(value).replace('T', ' ').slice(0, 19);
  }
  return String(value);
}

function CopyButton({ value }: { value: unknown }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(String(value ?? ''));
    } catch {}
  }
  return <button type="button" className="btn btn-ghost" onClick={copy}>copy</button>;
}

export default function DataTable<T extends Row>({
  rows,
  columns,
  emptyTitle = 'Нет данных',
  searchable = true,
  pageSize = 50,
}: {
  rows: T[];
  columns: Column<T>[];
  emptyTitle?: string;
  searchable?: boolean;
  pageSize?: number;
}) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(q));
  }, [query, rows]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  if (!rows.length) return <EmptyState title={emptyTitle} />;

  return (
    <div className="table-stack">
      {searchable && (
        <input
          className="table-search"
          value={query}
          onChange={(event) => { setQuery(event.target.value); setPage(1); }}
          placeholder="Поиск по таблице..."
        />
      )}
      <div className="table-container">
        <table>
          <thead>
            <tr>{columns.map((column) => <th key={String(column.key)}>{column.header}</th>)}</tr>
          </thead>
          <tbody>
            {pageRows.map((row, index) => (
              <tr key={index}>
                {columns.map((column) => {
                  const key = String(column.key);
                  const value = row[column.key as keyof T];
                  if (column.render) return <td key={key}>{column.render(value, row)}</td>;
                  if (key === 'status' || key === 'substatus') return <td key={key}><StatusBadge status={String(value ?? '')} /></td>;
                  if (key === 'transaction_id' || key === 'terminal_operation_number') {
                    return <td key={key}><span className="key-field">{formatCell(value, key)}</span> <CopyButton value={value} /></td>;
                  }
                  return <td key={key}>{formatCell(value, key)}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="actions">
        <button type="button" className="btn btn-secondary" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Назад</button>
        <span className="muted small">Страница {safePage} из {totalPages}. Всего строк: {filteredRows.length}</span>
        <button type="button" className="btn btn-secondary" disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Вперёд</button>
      </div>
    </div>
  );
}
