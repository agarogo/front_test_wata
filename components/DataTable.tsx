'use client';

import { useMemo, useState, type ReactNode } from 'react';
import EmptyState from './EmptyState';

type Row = Record<string, unknown>;

export type Column<T extends Row> = {
  key: keyof T | string;
  header: string;
  render?: (value: unknown, row: T) => ReactNode;
};

export default function DataTable<T extends Row>({
  rows,
  columns,
  emptyTitle = 'Нет данных',
  searchable = true,
}: {
  rows: T[];
  columns: Column<T>[];
  emptyTitle?: string;
  searchable?: boolean;
}) {
  const [query, setQuery] = useState('');
  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(q));
  }, [query, rows]);

  if (!rows.length) return <EmptyState title={emptyTitle} />;

  return (
    <div className="table-stack">
      {searchable && (
        <input
          className="table-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск по таблице..."
        />
      )}
      <div className="table-container">
        <table>
          <thead>
            <tr>{columns.map((column) => <th key={String(column.key)}>{column.header}</th>)}</tr>
          </thead>
          <tbody>
            {filteredRows.slice(0, 100).map((row, index) => (
              <tr key={index}>
                {columns.map((column) => {
                  const value = row[column.key as keyof T];
                  return <td key={String(column.key)}>{column.render ? column.render(value, row) : String(value ?? '—')}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filteredRows.length > 100 && <p className="muted small">Показаны первые 100 строк из {filteredRows.length}.</p>}
    </div>
  );
}
