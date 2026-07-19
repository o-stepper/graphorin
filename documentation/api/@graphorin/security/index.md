[**Graphorin API reference v0.13.2**](../../index.md)

***

[Graphorin API reference](/api/index.md) / @graphorin/security

# @graphorin/security

> Security primitives for the Graphorin framework.

`@graphorin/security` ships the runtime building blocks every other
`@graphorin/*` package uses to handle credentials safely:

- `SecretValue` - a runtime-safe wrapper class with full leakage barriers
  (`toString`, `toJSON`, `Symbol.toPrimitive`, `[Symbol.for('nodejs.util.inspect.custom')]`)
  and a cross-realm brand (`Symbol.for('graphorin.SecretValue')`).
- `SecretRef` - strict RFC 3986 URI parser for the `env:` / `keyring:` /
  `file:` / `encrypted-file:` / `literal:` / `ref:` / `vault://` schemes
  that appear in `*Ref` config fields.
- A pluggable `SecretResolver` registry that turns a parsed `SecretRef`
  into a live `SecretValue`.
- Four built-in `SecretsStore` implementations
  (`KeyringSecretsStore`, `EncryptedFileSecretsStore`, `EnvSecretsStore`,
  `MemorySecretsStore`), a `composeChain(...)` helper, and the
  `createSecretsStore({ kind: 'auto' })` factory with headless detection
  and downgrade audit.
- Per-tool `secretsAllowed` ACL plumbing built on `AsyncLocalStorage`,
  `withSecret(...)` scope tracking, and an in-process audit emitter the
  audit-log subsystem subscribes to.
- **Server token auth** - generator + parser for the canonical
  `<prefix>_<env>_v1_<entropy>_<crc32>` token format, scope grammar
  (`<resource>:<action>[:<id-or-glob>]`), `TokenVerifier` with
  HMAC-SHA256-against-pepper verification, an LRU warm cache, per-IP
  and per-token brute-force lockouts, a concurrent-verify cap, and a
  set of CRUD helpers (`createToken`, `revokeToken`, `rotateToken`,
  `rekeyTokens`, `generatePepper`).
- **Tamper-evident audit log** - `appendAudit`, `verifyAuditChain`,
  `pruneAudit`, `exportAudit`, a canonical-JSON serialiser, an
  `AuditDb` interface, a binding registry that fail-fasts when the
  encrypted-SQLite peer is missing, and the `bridgeSecretsToAudit` /
  `bridgeMemoryGuardToAudit` subscribers that forward events from
  the secrets and memory-guard layers. On top of the hash chain, an
  RFC-6962-style Merkle layer (`computeAuditTreeHead`,
  `signAuditCheckpoint` / `verifyAuditAgainstCheckpoint` with Ed25519
  keys, inclusion + consistency proofs) lets an external verifier
  hold a signed tree head and prove the log was not rewritten.
- **Tool-argument policies** (`@graphorin/security/policy`) -
  Progent-style declarative constraints over tool arguments
  (`evaluateToolArgumentPolicy`) plus a Rule-of-Two profile builder
  (`buildRuleOfTwoPolicy`), wired into the agent via
  `AgentConfig.toolPolicy` / `ruleOfTwo`.
- **Sandbox** - `createNoneSandbox`, `createWorkerThreadsSandbox`
  (default for user-defined tools, with optional `noNetwork` /
  `noFilesystem` shields), `createIsolatedVMSandbox` (opt-in peer
  dependency, auto-fallback to worker-threads with WARN-once when
  the peer is unavailable), `createDockerSandbox` (opt-in
  `dockerode` peer), and the `resolveSandbox(...)` tier resolver
  that mandates the `worker-threads + no-network + no-filesystem`
  policy on untrusted skills.
- **Memory-modification guard** - `classifyTool(...)` →
  `'pure' | 'side-effecting-no-memory' | 'memory-aware' | 'unknown' | 'untrusted'`,
  the four guard implementations (`NO_GUARD`, `API_BOUNDARY_GUARD`,
  `AUDIT_ONLY_GUARD`, `STRICT_FULL_GUARD`), an xxhash integrity
  helper, and a typed `memoryGuardAuditEmitter` the audit log
  subscribes to.
- **Guardrails** - `defineInputGuardrail` / `defineOutputGuardrail`
  builders, `composeGuardrails(...)` runner with documented
  `block` / `warn` / `rewrite` short-circuit semantics, and seven
  built-ins under `guardrails.*`: `maxLength`,
  `promptInjectionHeuristics`, `piiDetection`, `languageWhitelist`,
  `llmModeration`, `outputModeration`, `toolUsageValidator`.
- **Process hardening** - `applyProcessHardening({ refuseRoot, umask })`
  startup helper, `ensureFileMode` / `ensureDirMode` /
  `verifyFileMode` POSIX-mode utilities, the `graphorin doctor`
  library functions (`checkPerms`, `checkSecrets`, `checkEncryption`,
  `checkSystemd`), and the `generateBootstrapToken` /
  `generateAesSalt` helpers.
- **Outbound OAuth** - `createOAuthClient(...)` wires the OAuth 2.1
  surface required by the MCP authorization spec: discovery
  (RFC 8414 + RFC 9728), Dynamic Client Registration (RFC 7591),
  Authorization Code + PKCE-S256 (RFC 7636) with a built-in
  localhost callback server + cross-platform browser launcher,
  Device Authorization Grant (RFC 8628), refresh-token rotation
  with per-server-id debounce, and revocation (RFC 7009). The
  high-level helpers (`loginInteractive`, `listOAuthSessions`,
  `refreshOAuthSession`, `revokeOAuthSession`, `getOAuthStatus`)
  are the surface the CLI wraps. A typed lifecycle emitter
  (`onOAuthLifecycle`) surfaces `oauth.granted` /
  `oauth.refreshed` / `oauth.revoked` / `oauth.registered` /
  `mcp.auth.expired` events; a sibling audit emitter feeds the
  tamper-evident chain via `bridgeOAuthToAudit({ db })`.
- **Skills supply chain** - `verifySkillSignature(...)` parses the
  `graphorin-signature:` block from a SKILL.md frontmatter and
  verifies the ed25519-SHA-256 signature via Node's built-in
  `crypto.verify(...)` against a publisher key resolved from a
  well-known URL (with optional pinned fingerprint), an inline PEM,
  or an operator-installed Sigstore verifier. An operator `trustRoot`
  (allowed publishers / pinned key fingerprints / `allowSigstore`)
  caps which keys may verify at all - an unknown key fails closed
  with `'untrusted-key'`. `installSkillFromNpm`
  / `installSkillFromGit` enforce `--ignore-scripts` for every
  untrusted install (no override; `pnpm` preferred, falling back to
  `npm` / `yarn` only when `pnpm` is missing) and reject unsigned
  skills outright. The trust-policy resolver (`resolveTrustPolicy`,
  `evaluateSupplyChainPolicy`) honours operator-managed allow / deny
  lists with npm-style globbing. Every install fires a
  `skill:installed` audit event with the trust level, signature
  outcome, publisher, algorithm, and key source.

## Status

- **Version:** v0.13.2 - secrets foundations + server token auth +
  tamper-evident audit log + sandbox / memory-guard / guardrails /
  process-hardening runtime safety + outbound OAuth flows + skills
  supply-chain helpers.
- **License:** [MIT](https://github.com/o-stepper/graphorin/blob/main/LICENSE) - © 2026 Oleksiy Stepurenko.
- **Engines:** Node.js 22+ (ESM only).

## Installation

```bash
pnpm add @graphorin/security @graphorin/core
# Optional native peers (pulled in only when you opt into the matching backend)
pnpm add -O @napi-rs/keyring @node-rs/argon2 openid-client
```

`@napi-rs/keyring@^1.2.0` is required at runtime if you use the
`KeyringSecretsStore`; `@node-rs/argon2@^2.0.2` is required if you use
the `EncryptedFileSecretsStore`;
`better-sqlite3-multiple-ciphers@^12.9.0` is required if you open the
audit log directly (most consumers go through `@graphorin/store-sqlite`,
which depends on it transitively); `isolated-vm@^5.0.0` is required if
you opt into `IsolatedVMSandbox`; `dockerode@^4.0.0` is required if you
opt into `DockerSandbox`; `openid-client@^6.8.0` is the recommended
reference implementation for the OAuth subsystem (the built-in flows
already cover every MVP use case). All six are declared as **optional
peer dependencies** so deployments that do not exercise the
corresponding code paths never pull the native binaries. `yaml@^2.8.0`
is a regular dependency required to parse SKILL.md frontmatter for the
supply-chain signature verifier.

## Quick reference

```ts
import {
  SecretValue,
  parseSecretRef,
  validateSecretRefs,
  resolveSecret,
  registerResolver,
  createSecretsStore,
  composeChain,
  detectHeadless,
  getSecretsStoreStatus,
  withSecret,
  MemorySecretsStore,
  EnvSecretsStore,
  EncryptedFileSecretsStore,
  KeyringSecretsStore,
  // Server token auth
  TokenVerifier,
  authorize,
  createToken,
  generatePepper,
  parseScope,
  scopeMatches,
  // Audit log
  appendAudit,
  verifyAuditChain,
  pruneAudit,
  exportAudit,
  bridgeSecretsToAudit,
  bridgeMemoryGuardToAudit,
  openAuditDb,
  registerAuditDbBinding,
  // Sandbox
  createNoneSandbox,
  createWorkerThreadsSandbox,
  createIsolatedVMSandbox,
  createDockerSandbox,
  resolveSandbox,
  // Memory-modification guard
  classifyTool,
  createGuard,
  // Guardrails
  defineInputGuardrail,
  defineOutputGuardrail,
  composeGuardrails,
  guardrails,
  // Process hardening
  applyProcessHardening,
  ensureFileMode,
  ensureDirMode,
  verifyFileMode,
  generateBootstrapToken,
  checkPerms,
  checkSecrets,
  checkEncryption,
  checkSystemd,
  // Outbound OAuth
  createOAuthClient,
  createInMemoryOAuthServerStore,
  loginInteractive,
  listOAuthSessions,
  refreshOAuthSession,
  revokeOAuthSession,
  getOAuthStatus,
  registerOAuthStrategy,
  onOAuthAudit,
  onOAuthLifecycle,
  bridgeOAuthToAudit,
  // Skills supply chain
  verifySkillSignature,
  installSkillFromNpm,
  installSkillFromGit,
  evaluateSupplyChainPolicy,
  resolveTrustPolicy,
  auditInstalledSkills,
  onSupplyChainAudit,
  bridgeSupplyChainToAudit,
} from '@graphorin/security';
```

```ts
// Wrap a raw string at the I/O boundary (e.g. directly after env read).
const apiKey = SecretValue.fromString(process.env.OPENAI_API_KEY ?? '');

// Scoped access - the preferred read pattern.
await apiKey.use((raw) => fetch(url, { headers: { Authorization: `Bearer ${raw}` } }));

// Auto-pick the best store for the current environment.
const store = await createSecretsStore({ kind: 'auto' });
const value = await store.require('openai_api_key');

// Issue a fresh server token and authorise it.
const pepper = generatePepper();
const created = await createToken({
  tokenStore,
  pepper,
  env: 'live',
  scopes: ['agents:invoke', 'memory:read'],
  label: 'web-ui',
});
const verifier = new TokenVerifier({ tokenStore, pepper });
const result = await verifier.verify(created.raw.reveal(), { ip: '203.0.113.7' });
const auth = authorize(result, 'agents:invoke');
```

```ts
// Open the audit log (the SQLite-backed binding ships from
// @graphorin/store-sqlite; deployments with a custom store register
// their own binding via registerAuditDbBinding(...)).
const db = await openAuditDb({ path: 'audit.db', passphrase });
bridgeSecretsToAudit({ db });
bridgeMemoryGuardToAudit({ db });
await appendAudit(db, {
  actor: { kind: 'system', id: 'graphorin/security' },
  action: 'audit:db-opened',
  target: 'audit.db',
  decision: 'success',
});
const verify = await verifyAuditChain(db);
```

```ts
// Pick the sandbox tier from operator + trust-level inputs and
// run a user-defined tool through it.
const policy = resolveSandbox({
  trustLevel: 'user-defined',
  override: { kind: 'worker-threads', noNetwork: true, noFilesystem: true },
});
const sandbox = createWorkerThreadsSandbox({
  noNetwork: policy.noNetwork,
  noFilesystem: policy.noFilesystem,
});
const result = await sandbox.run<{ greeting: string }, string>(
  { kind: 'handler', module: '/abs/path/handler.mjs', export: 'main' },
  { input: { greeting: 'hi' }, timeoutMs: policy.timeoutMs },
);
```

```ts
// Compose a small input pipeline: heuristic injection + PII redaction.
const pipeline = [
  guardrails.promptInjectionHeuristics<string>(),
  guardrails.piiDetection<string>({ action: 'rewrite' }),
  guardrails.maxLength<string>({ chars: 4_000 }),
];
const decision = await composeGuardrails(pipeline, userInput, { stage: 'input' });
if (!decision.ok && decision.action === 'block') {
  throw new Error(`input rejected by ${decision.name}: ${decision.message}`);
}
const sanitized = decision.ok ? decision.value : decision.value;
```

```ts
// Apply process hardening on startup; refuse to run as root.
applyProcessHardening({ refuseRoot: true, umask: 0o077 });
await ensureDirMode(`${process.env.HOME}/.graphorin`, 0o700);
await ensureFileMode(`${process.env.HOME}/.graphorin/data.db`, 0o600);
const initialToken = generateBootstrapToken();
```

```ts
// Drive an interactive OAuth login against an MCP server. The
// helper opens the system browser, waits on the localhost
// callback, and persists the resulting tokens via the supplied
// OAuthServerStore.
const storage = createInMemoryOAuthServerStore();
const { client, status } = await loginInteractive({
  serverId: 'linear-mcp',
  serverUrl: 'https://mcp.linear.app',
  storage,
  scope: 'read write',
});
console.log('Granted scope:', status.scope, 'expires at', status.expiresAt);
// Refresh + revoke share the same client surface.
await client.refresh();
await client.revoke({ reason: 'user-initiated' });
```

```ts
// Verify a SKILL.md signature before loading the skill.
const result = await verifySkillSignature({ skillMd });
if (!result.valid) throw new Error(`Skill rejected: ${result.reason}`);

// Install a third-party skill from the npm registry. The runner
// always passes --ignore-scripts and rejects unsigned skills at
// trust level 'untrusted' (the default for npm + git sources).
await installSkillFromNpm({
  packageName: '@vendor/pdf-processing',
  version: '1.2.3',
  skillMd,
});
```

## Stability

Every exported symbol carries one of two TSDoc tags:

- `@stable` - covered by semver guarantees for the `v0.x` line.
- `@experimental` - may change between minor versions; release notes call
  out every breaking change.

## Versioning

`@graphorin/security` follows the lockstep release cadence of the rest
of the `@graphorin/*` packages while the framework is on the `0.x`
line.

---

**Project Graphorin** · v0.13.2 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>

## Modules

| Module | Description |
| ------ | ------ |
| [](/api/@graphorin/security/README.md) | @graphorin/security - security primitives for the Graphorin framework. Ships the `SecretValue` runtime-safe wrapper, the strict `SecretRef` URI parser, four `SecretsStore` implementations, the pluggable resolver registry, the per-tool ACL primitives, the `createSecretsStore({ kind: 'auto' })` factory, the server token- auth surface (HMAC-SHA256 + pepper, scope grammar, token CRUD, verify pipeline), and the tamper-evident audit log primitives. |
| [audit](/api/@graphorin/security/audit/index.md) | Audit-log surface for `@graphorin/security`. Provides the tamper-evident chain primitives (`appendAudit`, `verifyAuditChain`, `pruneAudit`, `exportAudit`), the `AuditDb` lifecycle plumbing, the binding registry, and the secrets-layer bridge that turns `SecretsAuditEvent`s into chain entries. |
| [auth](/api/@graphorin/security/auth/index.md) | Server token-auth surface for `@graphorin/security`. Combines the token format primitives, the scope grammar, the verify pipeline, and the token CRUD library functions used by `@graphorin/server` and the CLI. |
| [dataflow](/api/@graphorin/security/dataflow/index.md) | Provenance / taint-based data-flow policy for `@graphorin/security` (toward CaMeL). |
| [guard](/api/@graphorin/security/guard/index.md) | Memory-modification guard subsystem of `@graphorin/security`. The guard sits between a tool and the long-lived memory store; the tier-based policy (DEC-153) trades runtime cost against attack-surface coverage. |
| [guardrails](/api/@graphorin/security/guardrails/index.md) | Guardrails subsystem of `@graphorin/security`. Exposes the declarative `defineInputGuardrail` / `defineOutputGuardrail` builders, the `composeGuardrails(...)` runner with documented short-circuit semantics, and seven built-ins covering input length, inbound prompt-injection heuristics, PII redaction, language whitelisting, LLM moderation (input + output), and tool-usage validation. |
| [hardening](/api/@graphorin/security/hardening/index.md) | Hardening subsystem of `@graphorin/security`. Exposes the startup helpers, the POSIX file-mode utilities, the doctor library functions, and the bootstrap-token helpers. |
| [inspect](/api/@graphorin/security/inspect/index.md) | `@graphorin/security/inspect` - pluggable content-inspection seams (the injection classifier). |
| [oauth](/api/@graphorin/security/oauth/index.md) | Outbound OAuth subsystem of `@graphorin/security`. Implements the OAuth 2.1 surface required by the MCP authorization spec (Authorization Code + PKCE-S256 with RFC 7636, Refresh Token grant + RFC 6749 § 6 rotation, Device Authorization Grant per RFC 8628, Dynamic Client Registration per RFC 7591, server + resource metadata discovery per RFC 8414 + RFC 9728, and the RFC 7009 token-revocation endpoint). |
| [package.json](/api/@graphorin/security/package.json/index.md) | - |
| [policy](/api/@graphorin/security/policy/index.md) | Declarative tool-argument policies + Rule-of-Two capability profiles. Pure decision engines consumed by the tool executor's policy hook and the agent runtime's capability floor. |
| [sandbox](/api/@graphorin/security/sandbox/index.md) | Sandbox subsystem of `@graphorin/security`. Exposes the four built-in adapters, the `SandboxImpl` interface, the tier resolver, and the typed errors used by the dispatcher. |
| [secrets](/api/@graphorin/security/secrets/index.md) | Secrets foundations for `@graphorin/security`. Exposes the runtime-safe `SecretValue` wrapper, the strict `SecretRef` URI parser, the pluggable resolver registry, four built-in `SecretsStore` implementations, the per-tool ACL primitives, and the `createSecretsStore({ kind: 'auto' })` factory with downgrade audit. |
| [supply-chain](/api/@graphorin/security/supply-chain/index.md) | Skills supply-chain subsystem of `@graphorin/security`. Implements the install-time defences: |
