/* ============================================
   EIFA COUTURE — Admin Audit Log Data Access
   ============================================
   Read + write in one file since, unlike most `lib/admin/*` modules,
   this one has a single narrow write shape (`logAdminAction`) rather
   than a full CRUD surface — splitting into `-read`/`-write` would
   be more ceremony than the module needs.

   `logAdminAction` is additive infrastructure: it is not wired into
   any existing write module (products, coupons, orders, etc.) as
   part of this change, to keep this change scoped to the audit log
   module itself. Call it from an admin write action to record an
   entry, e.g.:

     await logAdminAction({
       action: 'update',
       entityType: 'product',
       entityLabel: product.name,
       entityId: product.id,
     });

   Reads use the SERVER Supabase client, same convention as the rest
   of `lib/admin/*-read.ts` — `src/app/admin/audit-log/page.tsx` is a
   Server Component.
   ============================================ */

import { createClient } from '@/lib/supabase/server';
import type { DbAuditLog } from '@/types/database';

export interface AuditLogEntry {
  id: string;
  actorName: string;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  entityLabel: string;
  detail: string | null;
  createdAt: string;
}

function mapRow(row: DbAuditLog): AuditLogEntry {
  return {
    id: row.id,
    actorName: row.actor_name,
    actorEmail: row.actor_email,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    entityLabel: row.entity_label,
    detail: row.detail,
    createdAt: row.created_at,
  };
}

export interface GetAuditLogsParams {
  entityType?: string;
  limit?: number;
}

export async function getAuditLogs(
  params: GetAuditLogsParams = {}
): Promise<{ data: AuditLogEntry[]; error: string | null }> {
  const { entityType, limit = 100 } = params;
  const supabase = await createClient();

  let query = supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (entityType) {
    query = query.eq('entity_type', entityType);
  }

  const { data, error } = await query;

  return {
    data: ((data ?? []) as DbAuditLog[]).map(mapRow),
    error: error?.message ?? null,
  };
}

export interface LogAdminActionInput {
  action: string;
  entityType: string;
  entityLabel: string;
  entityId?: string;
  detail?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Records one audit log entry as the currently authenticated admin.
 * Best-effort: failures are swallowed (logged to console) rather than
 * thrown, so a logging failure never blocks the admin action that
 * triggered it.
 */
export async function logAdminAction(input: LogAdminActionInput): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single();

  const actorName = (profile as { display_name: string } | null)?.display_name ?? 'Admin';

  const { error } = await supabase.from('audit_logs').insert({
    actor_id: user.id,
    actor_name: actorName,
    actor_email: user.email ?? null,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    entity_label: input.entityLabel,
    detail: input.detail ?? null,
    metadata: input.metadata ?? null,
  });

  if (error) {
    console.error('logAdminAction failed:', error.message);
  }
}
