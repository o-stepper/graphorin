---
'@graphorin/security': minor
'@graphorin/eslint-plugin': minor
---

Initial release of `@graphorin/security` — the security primitives for
the Graphorin framework. This release ships the **secrets foundations**
layer; server-token auth, audit hash chain, sandbox / guardrails,
OAuth, and skills supply-chain helpers will arrive in follow-on
releases on the same `0.1.x` line.

What is in this release:

- `SecretValue` — the runtime-safe wrapper class that backs the
  `SecretValue` contract from `@graphorin/core`. Stores its bytes in a
  private `Buffer`, exposes scoped access via `.use(fn)` /
  `.useBuffer(fn)` plus an audited one-shot `.reveal()` escape hatch,
  and pins the cross-realm brand `Symbol.for('graphorin.SecretValue')`
  on its prototype. Includes a deprecated `.unwrap()` method for the
  `0.x` compatibility window — the companion lint rule
  `@graphorin/no-secret-unwrap` flags every use. All four leakage
  barriers (`toString`, `Symbol.toPrimitive`, `toJSON`,
  `[Symbol.for('nodejs.util.inspect.custom')]`) are implemented and
  covered by property tests that walk every documented sink (template
  literals, `String(...)`, `JSON.stringify`, `util.inspect`,
  `Error.message`, `Buffer.from(...)`).
- `parseSecretRef(uri)` and friends — strict RFC 3986 subset parser
  for `*Ref` config fields with seven built-in schemes (`env:`,
  `keyring:`, `file:`, `encrypted-file:`, `literal:`, `ref:`,
  `vault://`) and helpers `validateSecretRefs`, `parseAuthority`,
  `getQueryParam(All)`. The parser is strict-by-default — typos in
  `*Ref` config fields fail-fast at bootstrap.
- A pluggable `SecretResolver` registry (`registerResolver`,
  `resolveSecret`) seeded with the seven built-in resolvers. The
  `literal:` scheme is **triple-gated** (env flag + config flag + a
  separate production-override flag) and warns once on accept.
- Four built-in `SecretsStore` implementations:
  - `KeyringSecretsStore` — backed by `@napi-rs/keyring@^1.2.0`
    (optional peer; macOS Keychain / Windows Credential Manager /
    Linux Secret Service).
  - `EncryptedFileSecretsStore` — AES-256-GCM bundle on disk; key
    derived via Argon2id (`m=64MiB, t=3, p=1`) using
    `@node-rs/argon2@^2.0.2` (optional peer); enforces mode `0o600`.
  - `EnvSecretsStore` — `process.env` reader, read-only by default.
  - `MemorySecretsStore` — in-memory `Map` for tests; refuses to
    start when `NODE_ENV='production'` unless `forceProduction: true`.
- `createSecretsStore({ kind: 'auto' })` factory with the canonical
  fallback chain (`keyring → encrypted-file → env`),
  `--strict-secrets` semantics, headless detection
  (`detectHeadless()`), per-event downgrade audit, and a `composeChain`
  helper for explicit chains. The factory wires the active store into
  the `ref:` resolver so `ref:KEY` works from configuration regardless
  of which physical backend wins. In library mode the factory honours
  the `GRAPHORIN_SECRETS_SOURCE` env var (single kind such as
  `'keyring'` or a comma-separated chain like
  `'encrypted-file,env'`) as the default when the caller does not
  pass an explicit `kind` / `fallbackChain`; this is the documented
  env-var counterpart of the `--secrets-source` CLI flag and is parsed
  through the standalone helper `parseSecretsSourceEnv`.
- `getSecretsStoreStatus()` — snapshot of the active store, fallback
  chain, downgrade reason, strict mode, and headless flags. Consumed
  by the standalone server's `/v1/health/secrets` endpoint and the
  `graphorin doctor --check-secrets` CLI command in later releases.
- Per-tool ACL primitives — `withToolSecretsContext`,
  `withChildToolSecretsContext`, `enforceSecretAcl`,
  `computeEffectiveAllowlist` — backed by `AsyncLocalStorage` so
  nested tool calls inherit and intersect their parent's allowlist
  across `await` boundaries.
- `withSecret(value, fn, { caller? })` — one-shot scoped access with
  audit emission. Auto-wraps plain strings into a `SecretValue`,
  records a single audit event per invocation, and emits the
  active-tool name when the call originates inside a
  `withToolSecretsContext(...)` scope.
- Audit emitters — three layers, each with its own subscription
  surface and well-typed event shape so the audit-log subsystem in a
  follow-on release can wire a single forwarder per concern:
  - `onSecretValueAudit` — every construct / use / use-buffer /
    reveal / dispose event on a `SecretValue`.
  - `onWithSecretAudit` — one event per `withSecret(...)` scope,
    including the active tool name when applicable.
  - `onSecretsAudit` (`secretsAuditEmitter`) — store-level events
    (`secret:get`, `secret:require`, `secret:set`, `secret:delete`)
    plus the factory `secrets:downgrade` event. Each event carries
    `action`, `decision`, `source`, `target`, optional `actor`
    (drawn from the active per-tool ACL context), and structured
    metadata. Listeners that throw are isolated from the secret
    access path.
- Typed errors — `GraphorinSecretsError`, `SecretRefParseError`,
  `UnknownSchemeError`, `SecretResolutionError`,
  `LiteralSecretsForbiddenError`, `SecretRequiredError`,
  `SecretAccessDeniedError`, `MemoryStoreInProductionError`,
  `StrictSecretsUnavailableError`, `MissingPeerDependencyError`.

The `@graphorin/eslint-plugin` companion update registers the
`no-secret-unwrap` rule scaffold (currently a no-op) so downstream
consumers can configure
`'@graphorin/no-secret-unwrap': 'warn'` today without churn when the
full implementation lands.
