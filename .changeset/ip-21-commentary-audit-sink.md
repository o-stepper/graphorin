---
'@graphorin/server': minor
---

Record delivery-commentary sanitization decisions in the audit log (IP-21).

`createWsDispatcher` ran the commentary sanitizer without a `sink`, so every
documented sanitization decision — which frames were wrapped or stripped on the
wire, with before/after SHA-256 digests and the matched-pattern bucket — was
computed and then silently dropped. Operators had no audit trail of what the
delivery layer redacted.

The server now bridges those decisions into the tamper-evident audit chain.
Because the WS dispatcher is built before the audit DB is unsealed (the DB opens
during `start()`), the dispatcher is handed a late-bound commentary sink whose
real audit-writing target is installed once the DB is available; writes
serialise through `appendAudit` and a failed write is isolated from the wire.

New public surface (server `@graphorin/server/commentary`):
`bridgeCommentaryToAudit`, `createLateBoundCommentarySink`,
`commentaryDecisionToAuditInput`, `COMMENTARY_AUDIT_ACTION`
(`'delivery:commentary:sanitized'`), and the `CommentaryAuditSink` /
`LateBoundCommentarySink` types.
