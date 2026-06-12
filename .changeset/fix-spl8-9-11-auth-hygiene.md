---
'@graphorin/security': patch
---

fix(security): auth/secrets hygiene — redacted naked-secret echoes, immediate revocation, pepper strength everywhere (SPL-8, SPL-9, SPL-11)

- **SPL-8**: `assertNotNakedString` echoed the full input — the likely RAW
  secret — into the error message and `SecretRefParseError.input`
  (documented safe-to-log). Both now carry a redacted form (4-char head +
  length).
- **SPL-9**: a revoked token kept verifying from the verifier's LRU cache
  for up to `cacheTtlMaxMs` (60s default). `revokeToken` / `rotateToken`
  accept an optional `verifier` and invalidate the token's cache entry
  immediately; without it the documented latency window still applies.
- **SPL-11**: `WeakPepperError` was enforced only in `rotatePepper` —
  `createToken`, `rekeyTokens` (via `rotateToken→createToken`) and
  `TokenVerifier` accepted 1-byte peppers, making stolen `hashHex` values
  offline-brute-forceable. `assertPepperStrength` now runs in
  `createToken` and lazily before the verifier's first `verify()`.
