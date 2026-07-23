import { getAuditLogs } from '@/lib/admin/audit-log';
import AuditLogTable from '@/components/admin/audit-log/AuditLogTable';

export const metadata = { title: 'Audit Log' };

export default async function AdminAuditLogPage() {
  const { data: entries, error } = await getAuditLogs({ limit: 100 });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl text-maroon">Audit Log</h1>
        <p className="text-charcoal/60 mt-1">
          {entries.length} recent action{entries.length === 1 ? '' : 's'}
        </p>
      </div>

      <AuditLogTable rows={entries} error={error} />
    </div>
  );
}
