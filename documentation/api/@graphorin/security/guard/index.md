[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / guard

# guard

Memory-modification guard subsystem of `@graphorin/security`. The
guard sits between a tool and the long-lived memory store; the
tier-based policy (DEC-153) trades runtime cost against
attack-surface coverage.

## References

### \_getMemoryGuardAuditListenerCountForTesting

Re-exports [_getMemoryGuardAuditListenerCountForTesting](/api/@graphorin/security/functions/getMemoryGuardAuditListenerCountForTesting.md)

***

### \_resetMemoryGuardAuditListenersForTesting

Re-exports [_resetMemoryGuardAuditListenersForTesting](/api/@graphorin/security/functions/resetMemoryGuardAuditListenersForTesting.md)

***

### ApiBoundaryGuardOptions

Re-exports [ApiBoundaryGuardOptions](/api/@graphorin/security/interfaces/ApiBoundaryGuardOptions.md)

***

### AuditOnlyGuardOptions

Re-exports [AuditOnlyGuardOptions](/api/@graphorin/security/interfaces/AuditOnlyGuardOptions.md)

***

### ClassifiableTool

Re-exports [ClassifiableTool](/api/@graphorin/security/interfaces/ClassifiableTool.md)

***

### classifyTool

Re-exports [classifyTool](/api/@graphorin/security/functions/classifyTool.md)

***

### createApiBoundaryGuard

Re-exports [createApiBoundaryGuard](/api/@graphorin/security/functions/createApiBoundaryGuard.md)

***

### createAuditOnlyGuard

Re-exports [createAuditOnlyGuard](/api/@graphorin/security/functions/createAuditOnlyGuard.md)

***

### createGuard

Re-exports [createGuard](/api/@graphorin/security/functions/createGuard.md)

***

### CreateGuardOptions

Re-exports [CreateGuardOptions](/api/@graphorin/security/type-aliases/CreateGuardOptions.md)

***

### createNoGuard

Re-exports [createNoGuard](/api/@graphorin/security/functions/createNoGuard.md)

***

### createStrictFullGuard

Re-exports [createStrictFullGuard](/api/@graphorin/security/functions/createStrictFullGuard.md)

***

### DEFAULT\_MEMORY\_TAG\_PATTERNS

Re-exports [DEFAULT_MEMORY_TAG_PATTERNS](/api/@graphorin/security/variables/DEFAULT_MEMORY_TAG_PATTERNS.md)

***

### emitMemoryGuardAudit

Re-exports [emitMemoryGuardAudit](/api/@graphorin/security/functions/emitMemoryGuardAudit.md)

***

### guardVariantForTier

Re-exports [guardVariantForTier](/api/@graphorin/security/functions/guardVariantForTier.md)

***

### GuardVerifyResult

Re-exports [GuardVerifyResult](/api/@graphorin/security/type-aliases/GuardVerifyResult.md)

***

### hashRegion

Re-exports [hashRegion](/api/@graphorin/security/functions/hashRegion.md)

***

### MemoryGuardActor

Re-exports [MemoryGuardActor](/api/@graphorin/security/interfaces/MemoryGuardActor.md)

***

### MemoryGuardAuditAction

Re-exports [MemoryGuardAuditAction](/api/@graphorin/security/type-aliases/MemoryGuardAuditAction.md)

***

### MemoryGuardAuditEvent

Re-exports [MemoryGuardAuditEvent](/api/@graphorin/security/interfaces/MemoryGuardAuditEvent.md)

***

### MemoryGuardAuditListener

Re-exports [MemoryGuardAuditListener](/api/@graphorin/security/type-aliases/MemoryGuardAuditListener.md)

***

### MemoryGuardBudgetExceededError

Re-exports [MemoryGuardBudgetExceededError](/api/@graphorin/security/classes/MemoryGuardBudgetExceededError.md)

***

### MemoryGuardDecision

Re-exports [MemoryGuardDecision](/api/@graphorin/security/type-aliases/MemoryGuardDecision.md)

***

### MemoryGuardTier

Re-exports [MemoryGuardTier](/api/@graphorin/security/type-aliases/MemoryGuardTier.md)

***

### MemoryModificationGuard

Re-exports [MemoryModificationGuard](/api/@graphorin/security/interfaces/MemoryModificationGuard.md)

***

### MemoryRegionReader

Re-exports [MemoryRegionReader](/api/@graphorin/security/interfaces/MemoryRegionReader.md)

***

### MemorySnapshot

Re-exports [MemorySnapshot](/api/@graphorin/security/interfaces/MemorySnapshot.md)

***

### onMemoryGuardAudit

Re-exports [onMemoryGuardAudit](/api/@graphorin/security/functions/onMemoryGuardAudit.md)

***

### StrictFullGuardOptions

Re-exports [StrictFullGuardOptions](/api/@graphorin/security/interfaces/StrictFullGuardOptions.md)

***

### xxhash32

Re-exports [xxhash32](/api/@graphorin/security/functions/xxhash32.md)
