// =====================================================
// Audit Logger
// Records user actions for compliance and security
// =====================================================

import { createAdminClient } from '@/lib/supabase/server';
import type { AuditAction, AuditEntityType } from '@/types/database';

/**
 * Audit log entry parameters
 */
export interface AuditLogParams {
  /** Organization ID (required for multi-tenancy) */
  organizationId: string;
  /** User ID who performed the action (null for system actions) */
  userId?: string | null;
  /** Type of action performed */
  action: AuditAction;
  /** Type of entity affected */
  entityType: AuditEntityType;
  /** ID of the affected entity */
  entityId: string;
  /** Additional context about the action */
  metadata?: Record<string, unknown>;
  /** HTTP request for IP and user agent extraction */
  request?: Request;
}

/**
 * Extended metadata with request info
 */
interface AuditMetadata extends Record<string, unknown> {
  ip?: string;
  userAgent?: string;
}

/**
 * Extract client info from request
 */
function extractRequestInfo(request?: Request): AuditMetadata {
  if (!request) return {};

  const headers = new Headers(request.headers);

  return {
    ip:
      headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      headers.get('x-real-ip') ||
      undefined,
    userAgent: headers.get('user-agent') || undefined,
  };
}

/**
 * Log an audit event
 *
 * @example
 * // Log candidate creation
 * await logAudit({
 *   organizationId: org.id,
 *   userId: user.id,
 *   action: 'create',
 *   entityType: 'candidate',
 *   entityId: candidate.id,
 *   metadata: { name: candidate.name },
 *   request,
 * });
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
  const {
    organizationId,
    userId,
    action,
    entityType,
    entityId,
    metadata = {},
    request,
  } = params;

  // Merge request info with provided metadata
  const requestInfo = extractRequestInfo(request);
  const fullMetadata: AuditMetadata = {
    ...metadata,
    ...requestInfo,
    timestamp: new Date().toISOString(),
  };

  try {
    const supabase = createAdminClient();

    const insertData = {
      organization_id: organizationId,
      user_id: userId ?? null,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata: fullMetadata,
    };

    const { error } = await supabase
      .from('audit_logs')
      .insert(insertData as never);

    if (error) {
      // Log error but don't throw - audit logging should not break main flow
      console.error('[AuditLog] Failed to insert audit log:', error);
    }
  } catch (err) {
    // Log error but don't throw
    console.error('[AuditLog] Error inserting audit log:', err);
  }
}

/**
 * Convenience functions for common audit actions
 */
export const auditLog = {
  /**
   * Log entity view
   */
  view: (
    params: Omit<AuditLogParams, 'action'>
  ): Promise<void> =>
    logAudit({ ...params, action: 'view' }),

  /**
   * Log entity creation
   */
  create: (
    params: Omit<AuditLogParams, 'action'>
  ): Promise<void> =>
    logAudit({ ...params, action: 'create' }),

  /**
   * Log entity update
   */
  update: (
    params: Omit<AuditLogParams, 'action'> & {
      changes?: Record<string, { before: unknown; after: unknown }>;
    }
  ): Promise<void> =>
    logAudit({
      ...params,
      action: 'update',
      metadata: { ...params.metadata, changes: params.changes },
    }),

  /**
   * Log entity deletion
   */
  delete: (
    params: Omit<AuditLogParams, 'action'>
  ): Promise<void> =>
    logAudit({ ...params, action: 'delete' }),

  /**
   * Log data export (PDF, CSV, etc.)
   */
  export: (
    params: Omit<AuditLogParams, 'action'> & { format?: string }
  ): Promise<void> =>
    logAudit({
      ...params,
      action: 'export',
      metadata: { ...params.metadata, format: params.format },
    }),
};
