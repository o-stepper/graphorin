---
'@graphorin/tools': minor
---

W-031: an inline timeout now actually STOPS the tool and stops inviting unsafe retries.

The TL-4 inline wall-clock previously rejected the awaiting promise but never aborted the per-call linked signal, so even a well-behaved tool listening on `ctx.signal` kept running in the background after the model was told it timed out. The timer now calls `linkedAbort.abort()` before rejecting; classification is reordered so the self-inflicted linked abort still reports `kind: 'timeout'` while a REAL cancellation (parent run signal) keeps reporting `'aborted'`. Recovery-envelope policy: a timeout on a `side-effecting`/`external-stateful` tool WITHOUT an `idempotencyKey` is now `recoverable: false` + `recoveryHint: 'report_to_user'` with a model-facing "the first invocation may still have completed; do not retry blindly" hint - the generic `retry_later` was an open invitation to double-execute a slow payment call. Read-only, pure and idempotency-keyed tools keep `retry_later`; `recoveryForKind` itself is unchanged for other call sites.
