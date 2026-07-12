---
'@graphorin/proactive': minor
'@graphorin/memory': minor
---

Cron-leg proactive tasks: `createProactiveCronTask` - fresh session per fire over durable triggers, REQUIRED fail-closed model pin (the fire never inherits the fallback chain), grant-to-capability mapping (`notify`/`question` fires run `capability: 'read-only'`, so acting without the grant is impossible by construction), deterministic no-recursive-scheduling guard (`schedulingToolNames` registry scan at creation, `allowRecursiveScheduling` as the explicit grant), ladder classification (completed -> `notify`/`act`; parked approvals -> `review`/`question` with a serialized `run:<runId>:<toolCallId>` resolve ref; a rung above the grant is auto-denied fail-closed) and `serializeApprovalRef`/`parseApprovalRef` helpers. The `'act'` grant is gated on evidence: `@graphorin/memory`'s facade now surfaces the configured B3 ingest gate as `memory.ingestGate` (null when inactive), and `grant: 'act'` without an active gate is a `ProactiveConfigError`.
