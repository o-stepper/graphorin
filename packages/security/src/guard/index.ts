/**
 * Memory-modification guard subsystem of `@graphorin/security`. The
 * guard sits between a tool and the long-lived memory store; the
 * tier-based policy (DEC-153) trades runtime cost against
 * attack-surface coverage.
 *
 * @packageDocumentation
 */

export {
  type ApiBoundaryGuardOptions,
  createApiBoundaryGuard,
} from './api-boundary-guard.js';
export {
  // Test-only:
  _getMemoryGuardAuditListenerCountForTesting,
  _resetMemoryGuardAuditListenersForTesting,
  emitMemoryGuardAudit,
  type MemoryGuardActor,
  type MemoryGuardAuditAction,
  type MemoryGuardAuditEvent,
  type MemoryGuardDecision,
  onMemoryGuardAudit,
} from './audit-emitter.js';
export {
  type AuditOnlyGuardOptions,
  createAuditOnlyGuard,
} from './audit-only-guard.js';
export {
  type ClassifiableTool,
  classifyTool,
  DEFAULT_MEMORY_TAG_PATTERNS,
} from './classifier.js';
export {
  type CreateGuardOptions,
  createGuard,
  guardVariantForTier,
} from './factory.js';
export { createNoGuard } from './no-guard.js';
export {
  createStrictFullGuard,
  MemoryGuardBudgetExceededError,
  type StrictFullGuardOptions,
} from './strict-full-guard.js';
export type {
  GuardVerifyResult,
  MemoryGuardTier,
  MemoryModificationGuard,
  MemoryRegionReader,
  MemorySnapshot,
} from './types.js';
export { hashRegion, xxhash32 } from './xxhash.js';
