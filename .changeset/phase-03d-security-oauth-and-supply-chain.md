---
'@graphorin/security': minor
'@graphorin/core': minor
---

`@graphorin/security` now ships the **outbound OAuth** subsystem and the
**skills supply-chain** helpers on top of the secrets foundations,
server token authentication, audit log, and runtime-safety layer. Two
new subpath exports (`@graphorin/security/oauth`,
`@graphorin/security/supply-chain`) sit alongside the existing
entrypoints; every new symbol is also re-exported from the package
root.

`@graphorin/core` adds the `OAuthServerStore` contract +
`OAuthServerRecord` shape so storage adapters can plug into the OAuth
subsystem from outside the security package.

What is in this release:

- **Outbound OAuth — full surface.** `createOAuthClient(...)` returns
  an `OAuthClient` that drives the OAuth 2.1 surface MCP servers
  expect:
  - **Authorization Code + PKCE-S256** (RFC 6749 + RFC 7636) with a
    built-in localhost callback server (random port in the
    `49152-65535` IANA dynamic range), cross-platform browser
    launcher, configurable timeout, and `AbortSignal` cancellation
    that tears the listener down within 100 ms.
  - **Device Authorization Grant** (RFC 8628) for headless / SSH
    deployments, with `slow_down` honour, configurable polling
    cadence, and `onUserCode` UI hook.
  - **Dynamic Client Registration** (RFC 7591) — auto-registers when
    the discovered metadata advertises a `registration_endpoint`,
    persists the resulting `client_id` (+ optional `client_secret` as
    a `SecretValue`) into the supplied `OAuthServerStore`.
  - **Authorization-server metadata discovery** (RFC 8414) plus
    **protected-resource metadata** (RFC 9728) — the discovery
    pipeline tries the resource hint first, then falls back to
    `/.well-known/oauth-authorization-server` and finally
    `/.well-known/openid-configuration`.
  - **Refresh-token grant** with per-server-id debounce (10 concurrent
    `refresh()` calls produce a single HTTP round-trip) and
    automatic mapping of `invalid_grant` → `OAuthRevokedError` +
    `mcp.auth.expired` lifecycle event.
  - **Revocation** via RFC 7009 with a silent no-op fallback when the
    server does not advertise `revocation_endpoint`.
  - Every flow accepts an `AbortSignal` and propagates
    cancellation as `OAuthFlowAbortedError`. Tokens cross the
    boundary wrapped in `SecretValue`.
- **Per-provider strategy registry.** `registerOAuthStrategy({...})`
  attaches `onTokenRotation` / `onRefreshFailure` hooks the client
  fires after every refresh outcome — the extension point for
  provider-specific quirks (e.g. rotated client secrets, single-use
  refresh tokens) without forking the core flow.
- **Library functions for the CLI.** `loginInteractive(...)`,
  `listOAuthSessions(...)`, `refreshOAuthSession(...)`,
  `revokeOAuthSession(...)`, and `getOAuthStatus(...)` wrap the
  client + storage so the upcoming `graphorin auth` CLI surface stays
  thin. `createInMemoryOAuthServerStore()` ships an in-memory
  reference implementation of the new contract.
- **OAuth lifecycle event emitter.** `onOAuthLifecycle(...)` exposes
  the typed `oauth.granted` / `oauth.refreshed` / `oauth.revoked` /
  `oauth.registered` / `mcp.auth.expired` channel consumed by the
  in-process MCP client. Listeners are isolated from the OAuth fast
  path.
- **OAuth audit emitter + bridge.** `onOAuthAudit(...)` mirrors the
  secrets / memory-guard pattern; `bridgeOAuthToAudit({ db })`
  forwards every event into a tamper-evident chain entry on the
  shared audit database.
- **Skills supply-chain helpers.** `verifySkillSignature(...)` parses
  the `graphorin-signature:` block from a SKILL.md frontmatter,
  resolves the publisher key (well-known URL with optional pinned
  fingerprint, inline PEM, or operator-installed Sigstore verifier),
  computes a deterministic canonical-bytes representation of the
  manifest with the signature block stripped + keys sorted
  recursively, and verifies the ed25519-SHA-256 signature via Node's
  built-in `crypto.verify(...)`.
- **Trust-policy resolver.** `resolveTrustPolicy(source, level)`
  derives the `--ignore-scripts` + signature requirements per source:
  `'folder'` defaults to `'trusted'` (with the optional
  `'trusted-with-scripts'` upgrade), `'npm-package'` and `'git-repo'`
  default to `'untrusted'` with **mandatory `--ignore-scripts`** and
  **mandatory signature verification**, and the strict-default
  sandbox tier propagates downstream.
- **Skill installer.** `installSkillFromNpm(...)` shells out to
  `pnpm add` (the project default), falling back to `npm install` and
  `yarn add` only when `pnpm` is missing from `PATH`; every
  invocation passes `--ignore-scripts` when the resolved policy
  requires it. `installSkillFromGit(...)` does the equivalent for
  shallow git clones into the OS temp directory. The runner is
  injectable for tests, so the unit suite never spawns a real
  package manager. Every install records a `skill:installed` audit
  event with the trust level, signature outcome, publisher,
  algorithm, and key source.
- **Allow / deny policy resolver.** `evaluateSupplyChainPolicy(...)`
  + `assertPolicyAllows(...)` honour operator-managed allow / deny
  lists with npm-style globbing (`@org/*` matches the entire scope),
  short-circuiting to `SkillInstallDeniedError` before any install
  step runs. The opt-in `'auto'` framework-curated denylist hook is
  reserved for a post-MVP rollout; the MVP keeps it dormant and
  documents the trade-off.
- **Installation registry.** `auditInstalledSkills()` returns the
  in-memory list of every installation captured this process — the
  surface the upcoming `graphorin skills audit` CLI binary wraps.
- **Supply-chain audit emitter + bridge.** `onSupplyChainAudit(...)`
  mirrors the OAuth + secrets emitters; `bridgeSupplyChainToAudit({
  db })` writes every event into the tamper-evident chain.
- **Typed errors.** `GraphorinOAuthError`, `OAuthDiscoveryError`,
  `OAuthRegistrationUnsupportedError`, `OAuthRefreshError`,
  `OAuthRevokedError`, `OAuthCallbackError`,
  `OAuthAuthorizationError`, `OAuthFlowAbortedError`,
  `OAuthCallbackPortError`, `OAuthPeerDependencyMissingError`,
  `GraphorinSupplyChainError`, `SkillSignatureMissingError`,
  `SkillSignatureInvalidError`, `SkillInstallDeniedError`,
  `SkillInstallError`, `SkillManifestParseError`,
  `TrustLevelEscalationError`. Every error carries a stable `kind`
  discriminator + an actionable `hint` field where applicable.
- **New optional peer dependency.** `openid-client@^6.8.0` is the
  recommended OAuth library; the security package treats it as an
  optional peer (the built-in implementation already covers every MVP
  flow). `yaml@^2.8.0` is a regular dependency required to parse
  SKILL.md frontmatter.
