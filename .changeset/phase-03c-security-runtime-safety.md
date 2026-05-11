---
'@graphorin/security': minor
---

`@graphorin/security` now ships the **runtime-safety** layer on top of
the secrets foundations and the server token authentication / audit
log. Four new subpath exports (`@graphorin/security/sandbox`,
`@graphorin/security/guard`, `@graphorin/security/guardrails`,
`@graphorin/security/hardening`) sit alongside the existing
`@graphorin/security/secrets`, `@graphorin/security/auth`, and
`@graphorin/security/audit` entrypoints; every new symbol is also
re-exported from the package root.

What is in this release:

- **Sandbox** — four built-in adapters constructed via
  `createNoneSandbox(...)`, `createWorkerThreadsSandbox(...)`,
  `createIsolatedVMSandbox(...)`, and `createDockerSandbox(...)`. The
  worker-threads adapter is the framework default for user-defined
  tools; it dispatches code into a freshly-spawned worker thread,
  enforces a hard wall-clock timeout via `worker.terminate()`,
  honours `AbortSignal` cancellation with a configurable grace
  period, optionally blocks `node:fs` / `node:fs/promises` /
  `node:http` / `node:https` / `node:net` / `node:dgram` /
  `node:tls` imports through Node 22's stable `module.register(...)`
  resolver hook, and refuses `globalThis.fetch` calls. The
  isolated-vm adapter resolves its peer dependency lazily and
  auto-falls back to the worker-threads adapter (with a single
  WARN per process) when the optional native binary is unavailable.
  The Docker adapter spawns a one-shot container against an
  operator-supplied image with `NetworkDisabled`, `ReadonlyRootfs`,
  `CapDrop: ['ALL']`, and `SecurityOpt: ['no-new-privileges']`
  defaults. `isolated-vm@^5.0.0` and `dockerode@^4.0.0` are new
  optional peer dependencies declared at this layer.
- **Sandbox tier resolver** — `resolveSandbox({ trustLevel, override })`
  returns a `ResolvedSandboxPolicy` per the canonical sandbox tier
  table: `'built-in'` → `none`; `'user-defined'` / `'trusted'` →
  honour operator override (default `worker-threads`); **`'untrusted'`
  → mandatory `worker-threads + no-network + no-filesystem`** with
  `forced: true` whenever the operator's choice is overridden, and a
  `reason` string surfaced through traces / WARN logs.
- **Memory-modification guard** — `classifyTool(...)` derives the
  guard tier from the operator opt-in / trust level / tags / ACL
  per the canonical decision tree. The four guard implementations
  trade runtime cost against attack-surface coverage: `NO_GUARD`
  (zero overhead, for `'pure'` and `'side-effecting-no-memory'`
  tools), `API_BOUNDARY_GUARD` (call-path validation against an
  `allowedOps` allowlist for `'memory-aware'` tools),
  `AUDIT_ONLY_GUARD` (xxhash snapshot + verify with audit-only
  reporting for `'unknown'` tools — the framework default), and
  `STRICT_FULL_GUARD` (xxhash snapshot + verify + 200 KB memory
  budget + `ok: false` on mismatch so the runtime can roll back —
  for `'untrusted'` tools sourced from external skills). The
  subsystem ships its own typed `memoryGuardAuditEmitter` that
  the audit-log subscribes to via `bridgeMemoryGuardToAudit({ db })`.
- **Guardrails** — `defineInputGuardrail(...)` and
  `defineOutputGuardrail(...)` builders, the `composeGuardrails(...)`
  runner with documented short-circuit semantics on `'block'` /
  accumulation on `'warn'` / in-flight rewrite on `'rewrite'`, plus
  seven built-ins under `guardrails.*`: `maxLength` (configurable
  chars + token budget via injected `countTokens`),
  `promptInjectionHeuristics` (regex catalogue covering the
  canonical inbound-injection family — defence in depth, not full
  immunity), `piiDetection` (email / SSN / phone / Luhn-validated
  credit cards / IBAN / BTC addresses with `'block' | 'warn' |
  'rewrite'` actions), `languageWhitelist` (with a hand-rolled
  multilingual stopword detector covering English / Russian /
  Ukrainian / German / French / Spanish / Italian / Portuguese /
  Polish / Czech, and an injection point for a richer detector),
  `llmModeration` and `outputModeration` (provider-injected via
  callback so the security package does not depend on
  `@graphorin/provider`), and `toolUsageValidator` (required /
  forbidden / max-calls / max-per-tool plus an operator-supplied
  predicate).
- **Process hardening** — `applyProcessHardening({ refuseRoot,
  umask, allowRoot })` startup helper that refuses to run as `root`
  on POSIX hosts (DEC-135), sets `process.umask(0o077)` early, and
  records the resolved status for downstream consumers via
  `getHardeningStatus()`. The `ensureFileMode(...)`,
  `ensureDirMode(...)`, and `verifyFileMode(...)` POSIX-mode
  utilities prefer `fs.fchmod()` when the host process started
  with `--permission` (CVE-2024-36137 mitigation). The
  `graphorin doctor` library functions (`checkPerms(...)`,
  `checkSecrets(...)`, `checkEncryption(...)`, `checkSystemd(...)`)
  return structured `CheckResult[]` rows the CLI binary in Phase 15
  wraps as subcommands. `generateBootstrapToken()` returns a
  256-bit base62url-encoded random token via
  `crypto.randomBytes(32)` per DEC-135;
  `generateAesSalt()` returns a 16-byte salt for AES-GCM key
  derivation.
- **Typed errors** — `GraphorinSandboxError`,
  `UnsupportedSandboxKindError`, `SandboxPeerUnavailableError`,
  `MandatorySandboxOverrideError`, `SandboxFsAccessDeniedError`,
  `SandboxNetworkAccessDeniedError`, `MemoryGuardBudgetExceededError`,
  `GraphorinHardeningError`, `RefuseToRunAsRootError`,
  `FileModeMismatchError`. Every error subclasses
  `GraphorinSecretsError` so callers can keep a single `instanceof`
  check at module boundaries.
