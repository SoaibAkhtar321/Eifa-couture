'use client';

import type { ReactNode } from 'react';

import LoadingState from './LoadingState';
import ErrorState from './ErrorState';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export default function DataTable<T>({
  columns,
  rows,
  getRowKey,
  isLoading = false,
  error = null,
  emptyMessage = 'No records found.',
  onRowClick,
}: DataTableProps<T>) {
  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-charcoal/10 bg-ivory p-10 text-center text-sm text-charcoal/50">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-charcoal/10 bg-ivory">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-charcoal/10 bg-beige/60">
            {columns.map((column) => (
              <th
                key={column.key}
                className="text-left font-medium text-charcoal/60 uppercase tracking-wide text-xs px-4 py-3"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={getRowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={
                onRowClick
                  ? 'border-b border-charcoal/5 last:border-0 cursor-pointer hover:bg-beige/40 transition-colors'
                  : 'border-b border-charcoal/5 last:border-0'
              }
            >
              {columns.map((column) => (
                <td key={column.key} className={`px-4 py-3 align-middle ${column.className ?? ''}`}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}