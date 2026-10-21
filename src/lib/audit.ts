import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export interface AuditEventParams {
  actorUserId?: string | null;
  partnerOrgId?: string | null;
  entityType: string;
  entityId: string;
  eventType: string;
  beforeData?: Prisma.InputJsonValue | null;
  afterData?: Prisma.InputJsonValue | null;
  metadata?: Prisma.InputJsonValue | null;
  ipAddress?: string | null;
}

/**
 * Record an immutable audit log entry in PostgreSQL.
 */
export async function logAuditEvent(params: AuditEventParams) {
  try {
    return await prisma.auditEvent.create({
      data: {
        actor_user_id: params.actorUserId || null,
        partner_organization_id: params.partnerOrgId || null,
        entity_type: params.entityType,
        entity_id: params.entityId,
        event_type: params.eventType,
        before_data: params.beforeData ?? Prisma.JsonNull,
        after_data: params.afterData ?? Prisma.JsonNull,
        metadata: params.metadata ?? Prisma.JsonNull,
        ip_address: params.ipAddress || null,
      },
    });
  } catch (error) {
    console.error('[AUDIT_LOG_ERROR]', error);
  }
}
