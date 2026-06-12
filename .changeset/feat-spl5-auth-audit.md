---
'@graphorin/security': minor
---

feat(security): server-token auth audit events now have producers (SPL-5)

The audit catalogue advertised `token:create|revoke|rotate|rekey` and
`auth:granted|denied:*` but no code emitted them — server-token
mint/revoke/rotate and (most importantly) brute-force / lockout /
revoked-token verification attempts were untraceable in the tamper-evident
audit chain.

- New `@graphorin/security/auth` emitter (`onAuthAudit` / `emitAuthAudit`
  / `AuthAuditEvent`), mirroring the secrets / oauth / supply-chain
  emitters so the auth layer never writes audit rows across the package
  boundary itself.
- `createToken` / `revokeToken` / `rotateToken` / `rekeyTokens` emit their
  `token:*` events; `TokenVerifier.verify` emits `auth:granted` on success
  and `auth:denied:lockout` when a locked-out token is presented.
- New `bridgeAuthToAudit({ db })` translates each event into an
  `appendAudit(...)` call (serialised through the SPL-4 chain mutex; failed
  writes logged, never swallowed). End-to-end test: the full lifecycle
  reaches the chain and `verifyAuditChain` stays valid.
- Corrected the false `audit-db.ts` doc-claim that the binding factory
  writes an `audit:db-opened` chain entry (it does not — the db is not yet
  ready to record its own opening).
