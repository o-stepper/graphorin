---
'@graphorin/security': minor
---

`@graphorin/security` now ships the **server token authentication** and
**tamper-evident audit log** layers on top of the secrets foundations.
Two new subpath exports (`@graphorin/security/auth` and
`@graphorin/security/audit`) sit alongside the existing
`@graphorin/security/secrets` entrypoint; every new symbol is also
re-exported from the package root.

What is in this release:

- **Server token format** — `generateRawToken` + `parseToken` +
  `verifyOffline` produce and validate the canonical
  `<prefix>_<env>_v1_<43-char base62 entropy>_<6-char base62 crc32>`
  shape. The default prefix is `gph`. Tokens carry 256 bits of
  `crypto.randomBytes`-sourced entropy plus an embedded CRC32
  checksum so structurally-malformed tokens are rejected without a
  database round trip. The supporting primitives `crc32`,
  `encodeBase62Bytes`, and `encodeBase62Integer` are exported for
  consumers who need them.
- **Scope grammar** — `parseScope` / `tryParseScope` /
  `validateScopeSet` / `scopeMatches` / `scopeSetMatches` enforce the
  `<resource>:<action>[:<id-or-glob>]` grammar with `admin:*` as the
  superset wildcard. The `SCOPE_CATALOGUE` constant lists the
  well-known scopes consumed by the framework's HTTP and CLI surfaces.
- **`TokenVerifier` + functional `verifyToken`** — async pipeline that
  combines the offline structural check, an LRU warm cache (size and
  TTL configurable; bounded by the token's own expiry), the
  HMAC-SHA256 computation against the active server pepper, and an
  injected `AuthTokenStore` lookup. Failures surface as
  `{ ok: false, reason }` for the malformed / unknown-token / revoked
  / expired / ip-locked-out / token-locked-out cases so HTTP
  middleware can map them straight to status codes. The verifier
  enforces a per-IP sliding-window lockout, a per-token sliding-window
  lockout, and a global concurrent-verify cap that throws a typed
  `TokenVerifyOverloadError` when exceeded. The `authorize(...)`
  helper combines a verify result with a required scope.
- **Token CRUD library functions** — `createToken`, `listTokens`,
  `revokeToken`, `rotateToken`, `rotatePepper`, `rekeyTokens`, plus
  the `generatePepper()` helper that returns a 256-bit `SecretValue`.
  Every function operates against the cross-package `AuthTokenStore`
  contract from `@graphorin/core`; the framework default
  implementation lands in `@graphorin/store-sqlite` once the
  persistence layer ships. Created tokens are returned as
  `SecretValue`s so the plaintext is never accidentally logged on the
  way back to the caller.
- **Tamper-evident audit log** — `appendAudit`, `verifyAuditChain`,
  `pruneAudit`, `exportAudit`, `computeAuditHash`, plus the
  `canonicalJson` serialiser that ships the framework's deterministic
  JSON contract (sorted keys, `undefined` dropped, `BigInt` /
  cyclic / non-finite values rejected). Each entry carries a SHA-256
  hash of the canonical-JSON serialisation chained against the prior
  entry's hash; `verifyAuditChain` walks the chain and surfaces the
  first divergent link. `pruneAudit` reroots the surviving suffix at
  the genesis prev-hash and recomputes the rolling chain hashes so the
  trimmed log keeps verifying clean.
- **`AuditDb` lifecycle** — concrete bindings live in dedicated
  packages (the SQLite-backed binding ships from
  `@graphorin/store-sqlite`); `@graphorin/security` owns the
  contract, the `registerAuditDbBinding` registry, and the
  `openAuditDb` factory that fail-fasts with
  `AuditDbCipherUnavailableError` when no binding is registered.
  `better-sqlite3-multiple-ciphers@^12.9.0` is a new optional peer
  dependency declared at this layer.
- **Secrets ↔ audit bridge** — `bridgeSecretsToAudit({ db })` is a
  one-line subscriber that turns `SecretsAuditEvent`s emitted by the
  secrets layer into chain entries. Write failures inside the bridge
  are isolated from the secret access path via the
  `onWriteError` callback.
- **Typed errors** — `TokenFormatError`, `ScopeParseError`,
  `TokenVerifyOverloadError`, `TokenLockedOutError`, `WeakPepperError`,
  `AuditDbCipherUnavailableError`, `AuditChainBrokenError`,
  `AuditPayloadSerializationError`. Every error subclasses
  `GraphorinSecretsError` so callers can keep a single `instanceof`
  check at module boundaries.
