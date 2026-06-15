"use client";

import { useState, useEffect } from 'react';

interface Column<T> {
  key: keyof T;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  searchKey?: keyof T;
  onSearch?: (query: string) => void;
  maxRows?: number;
}

export default function DataTable<T extends { [key: string]: any }>({
  columns,
  data,
  loading = false,
  emptyMessage = 'Нет данных',
  searchKey,
  onSearch,
  maxRows = 100,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState<T[]>(data);

  useEffect(() => {
    setFilteredData(data);
  }, [data]);

  useEffect(() => {
    if (!searchKey || !searchQuery) {
      setFilteredData(data.slice(0, maxRows));
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = data.filter(row => 
      String(row[searchKey] ?? '').toLowerCase().includes(query)
    ).slice(0, maxRows);
    setFilteredData(filtered);
  }, [searchQuery, data, searchKey, maxRows]);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setSearchQuery(value);
    if (onSearch) {
      onSearch(value);
    }
  }

  if (loading) {
    return (
      <div className="table-container">
        <div className="empty-state">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      {searchKey && (
        <div className="table-search">
          <input
            type="text"
            placeholder="Поиск..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
      )}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={String(col.key)} style={col.width ? { width: col.width } : {}}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="empty-state">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filteredData.map((row, idx) => (
                <tr key={idx}>
                  {columns.map((col) => (
                    <td key={String(col.key)}>
                      {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {data.length > maxRows && (
        <div className="text-muted text-sm">
          Показано {maxRows} из {data.length} записей
        </div>
      )}
    </div>
  );
}
