// =====================================================
// Audit Module Exports
// =====================================================

export { logAudit, auditLog } from './audit-logger';
export type { AuditLogParams } from './audit-logger';

// Re-export database types for convenience
export type { AuditAction, AuditEntityType } from '@/types/database';
