'use client';

import DataTable, { type DataTableColumn } from '@/components/admin/DataTable';
import type { AuditLogEntry } from '@/lib/admin/audit-log';

interface AuditLogTableProps {
  rows: AuditLogEntry[];
  error: string | null;
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function actionLabel(row: AuditLogEntry): string {
  // e.g. "edited Product X", "deleted Coupon Y", "changed Order #1024"
  const verb: Record<string, string> = {
    create: 'created',
    update: 'edited',
    delete: 'deleted',
    status_change: 'changed',
  };
  return verb[row.action] ?? row.action;
}

const columns: DataTableColumn<AuditLogEntry>[] = [
  {
    key: 'actor',
    header: 'Admin',
    render: (row) => <span className="font-medium text-charcoal">{row.actorName}</span>,
  },
  {
    key: 'action',
    header: 'Action',
    render: (row) => (
      <span className="text-charcoal/80">
        {actionLabel(row)} <span className="text-charcoal">{row.entityLabel}</span>
      </span>
    ),
  },
  {
    key: 'detail',
    header: 'Detail',
    render: (row) => <span className="text-charcoal/60">{row.detail ?? '—'}</span>,
  },
  {
    key: 'entityType',
    header: 'Module',
    render: (row) => (
      <span className="rounded-full bg-beige/70 px-2.5 py-1 text-xs uppercase tracking-wide text-charcoal/60">
        {row.entityType}
      </span>
    ),
  },
  {
    key: 'createdAt',
    header: 'When',
    render: (row) => <span className="text-charcoal/60">{formatTimestamp(row.createdAt)}</span>,
  },
];

export default function AuditLogTable({ rows, error }: AuditLogTableProps) {
  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.id}
      error={error}
      emptyMessage="No admin activity recorded yet."
    />
  );
}
