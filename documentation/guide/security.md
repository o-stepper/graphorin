---
title: Security
description: Sandbox tiers, server-token auth, audit log, OAuth 2.1, supply-chain pipeline, the lateral-leak defense layer, and the provenance / data-flow policy.
---

# Security

Security is a first-class subsystem in Graphorin, not an afterthought. `@graphorin/security` ships:

- **Secrets** - `SecretValue` wrapper, `SecretRef` URI scheme, OS keychain integration, optional encrypted-file store. See [Secrets](/guide/secrets) for the full sub-page.
- **Sandbox tiers** - `'none'`, `'worker-threads'`, `'isolated-vm'`, `'docker'`.
- **Server-token authentication** - HMAC-SHA256 with a deployment-wide pepper.
- **Audit log** - SQLite database with mandatory encryption-at-rest and a SHA-256 hash chain.
- **OAuth 2.1 with PKCE** - outbound flows for MCP servers and skill registries.
- **Supply-chain helpers** - Ed25519 signature verification for distributed skills.
- **Lateral-leak defense layer** - composes orthogonally with the agent runtime's safety primitives.
- **Provenance / data-flow policy** - opt-in, taint-based enforcement at the tool boundary that defuses the lethal trifecta (`@graphorin/security/dataflow`).

## Sandbox tiers

```mermaid
flowchart LR
    A[Tool / skill / MCP-derived call] --> Resolver[resolveSandbox]
    Resolver -->|fully trusted, in-process| None[none]
    Resolver -->|default isolation| Wt[worker-threads]
    Resolver -->|untrusted JS, opt-in| Vm[isolated-vm]
    Resolver -->|untrusted binary, opt-in| Docker[docker]
```

| Tier (resolved kind) | `sandboxPolicy` | Backed by | Used for |
|---|---|---|---|
| `'none'` | `'none'` | The Node.js process. | Fully-trusted first-party tools. |
| `'worker-threads'` | `'sandboxed'` | Node.js worker threads (built-in - no peer dependency). Workers run with an empty environment (`env: {}` + a pre-run scrub) - the host `process.env` is never inherited; only the explicit `SandboxRunOptions.env` allowlist is visible. | **The default isolation tier.** Today it backs **code-mode** script execution (and any tool an operator routes through a custom `sandboxResolver`). Inline `config.tools` and MCP-derived tools resolve to this policy but run **in-process** - see below. |
| `'isolated-vm'` | `'isolated'` | [`isolated-vm`](https://github.com/laverdet/isolated-vm) (peer dependency, ISC). | Untrusted JavaScript skills. |
| `'docker'` | `'docker'` | [`dockerode`](https://github.com/apocas/dockerode) (peer dependency, Apache-2.0). | Untrusted binaries / full subprocess isolation. |

A tool declares its tier through `sandboxPolicy`; the executor maps that to a resolved kind (`'sandboxed' → 'worker-threads'`, `'isolated' → 'isolated-vm'`). Today this policy is **advisory for inline (`config.tools`) and MCP-derived tools**: it is resolved and surfaced on the `tool.execute` span / audit row, but those tools execute **in-process** - the agent runtime intentionally ships with no `sandboxResolver` wired. Real out-of-process isolation applies only to **code-mode** scripts and to tools an operator routes through a custom `sandboxResolver`; module-loadable skill / MCP isolation is wired when those land. See the per-field runtime behaviour in [Agent runtime](/guide/agent-runtime).

The `'worker-threads'` tier is **best-effort** isolation, not a security boundary: the worker shares the host process and filesystem. It blocks `fs` / network module imports (ESM resolve hook + a CJS `require` interception) and always denies the process-escape modules `child_process` / `vm` / `cluster` / `inspector` / `worker_threads` (SDF-9), but a determined attacker with native addons or other escapes is not contained - load genuinely untrusted code under `'isolated-vm'` (V8 isolate) or `'docker'` (kernel) instead.

`isolated-vm` and `dockerode` are **opt-in peer dependencies** - they are not installed by default, so a base install pulls in zero native sandbox code. Add them only if you load untrusted code; `'none'` and `'worker-threads'` need nothing extra.

## Sensitivity model

Every message, memory row, tool result, and trace attribute carries a `Sensitivity` tag:

| Tag | Meaning | Where it can flow |
|---|---|---|
| `public` | No restrictions. | Anywhere. |
| `internal` | Operator-private but not user-secret. | Local trace + opt-in collectors; never to providers without `acceptsSensitivity: ['internal']`. |
| `secret` | User secret. | Never leaves the process. Memory rows tagged `secret` are filtered before any payload reaches a provider. |

The default for an unfamiliar provider is **deny everything except `public`** until you opt in. The default for an exporter is **never `secret`**, and you cannot override it.

## Server-token authentication

The standalone server (`@graphorin/server`) requires every authenticated REST / WebSocket / SSE connection to present a bearer token signed with HMAC-SHA256 against a deployment-wide pepper. The unauthenticated `/v1/health` probe is exempt so liveness checks work before token verification is wired. Tokens are generated and rotated through `graphorin token`:

```bash
graphorin token create --scopes agents:invoke --expires-in 30d
graphorin token list
graphorin token revoke <token-id>
```

The pepper itself is resolved at server boot through a `SecretRef` (typically stored under `keyring:graphorin_server_pepper` or the encrypted-file store). See [Secrets](/guide/secrets) for the resolution pipeline.

**Pepper strength.** Consuming a pepper (`createToken`, `rekeyTokens`, the `TokenVerifier`'s first use) runs a weak-secret check: peppers below 32 bytes, with low Shannon entropy, or containing a long run of identical bytes (placeholder/test values) are rejected with a `WeakPepperError` whose `reason` explains the failure. Generate peppers with `crypto.randomBytes(32)` or the auth library's `generatePepper()`. The underlying heuristic is exported as `assessSecretStrength(bytes)` from `@graphorin/security` (and `@graphorin/security/hardening`) - a pure function returning `{ ok, reason, shannonBitsPerByte, maxIdenticalRun, … }` - so you can apply the same bar to your own passphrases.

## Audit log

Every privileged operation writes one row to the audit log:

- secret access (read / write / list);
- tool execution (start / end / approval);
- memory mutations (write / supersede / forget);
- skill installs (with signature verification result);
- token issuance / revocation;
- OAuth flows (initiation / token issuance / refresh).

The audit log lives in a dedicated SQLite database with **mandatory encryption-at-rest** (via [`better-sqlite3-multiple-ciphers`](https://github.com/m4heshd/better-sqlite3-multiple-ciphers)) and a **SHA-256 hash chain** that links every row to its predecessor. Tampering breaks the chain.

The CLI command `graphorin audit verify` walks the chain and reports any breaks (`graphorin audit export` / `prune` round out the group).

### Merkle transparency + signed checkpoints (D4)

The linear hash chain is tamper-*evident* but not tamper-*resistant*: a writer who can rewrite the whole database can re-root the chain (exactly what `pruneAudit` does by design). `@graphorin/security/audit` adds an RFC-6962 Merkle layer over the same rows so the log can be **anchored** and made tamper-resistant against that adversary:

```ts
import {
  signAuditCheckpoint,
  verifyAuditAgainstCheckpoint,
  generateAuditSigningKeyPair,
} from '@graphorin/security/audit';

const { publicKeyPem, privateKeyPem } = generateAuditSigningKeyPair(); // Ed25519
// Periodically sign the current tree head and store it OUT OF BAND
// (a different host, an object store, a ticket):
const checkpoint = await signAuditCheckpoint(auditDb, { privateKeyPem, writerId: 'ci' });

// Later - the signature is valid AND the live log is an append-only
// extension of the checkpointed head (any rewrite of the covered prefix
// fails the RFC-6962 consistency proof):
const result = await verifyAuditAgainstCheckpoint(auditDb, checkpoint, { publicKeyPem });
```

Also available: `computeAuditTreeHead`, `proveAuditInclusion` / `verifyAuditInclusion` ("entry N is in the log with head H"), and `proveAuditConsistency` / `verifyAuditConsistency`. As long as one signed checkpoint survives outside the writer's reach, a rewrite, reorder, or truncate-and-re-root is detectable.

## OAuth 2.1 with PKCE

```mermaid
sequenceDiagram
    autonumber
    participant App as @graphorin/cli
    participant Browser as User browser
    participant AS as Authorisation server
    participant Vault as Secrets store

    App->>App: Generate PKCE code_verifier
    App->>Browser: Open authorize URL with code_challenge
    Browser->>AS: Authorisation request
    AS-->>Browser: Redirect with code
    Browser-->>App: Loopback callback (code)
    App->>AS: Token exchange (code + code_verifier)
    AS-->>App: access_token + refresh_token
    App->>Vault: Store as SecretValue
```

The client is built on [`openid-client`](https://github.com/panva/openid-client) (MIT). Token storage uses the configured secrets store (OS keychain by default). Refresh happens lazily on the next call - no background daemon ever phones home.

**Refresh-token rotation.** When an authorisation server rotates refresh tokens (RFC 6749 §10.4 / OAuth 2.1), pass `revokePreviousOnRotation: true` to `refreshAccessToken(...)` to best-effort revoke the previous refresh token once the new one is issued. It is opt-in (default `false`) and revocation failures never fail the refresh.

## Supply-chain pipeline

```mermaid
flowchart LR
    A[npm-package or git-repo] --> Fetch[Fetch with --ignore-scripts]
    Fetch --> SigCheck[Ed25519 signature]
    SigCheck -->|pass| Validate[Frontmatter validator]
    SigCheck -->|fail| Reject[Reject + audit row]
    Validate --> Sandbox[Sandbox tier from frontmatter]
    Sandbox --> Loader[Skill loader]
```

Loading from `npm-package` or `git-repo` always:

- runs the install with `--ignore-scripts` enforced (no `postinstall` execution);
- fetches the publisher's Ed25519 public key from the configured well-known URL;
- verifies the package's bundled signature against the resolved key;
- writes one audit row recording success or failure.

Local `folder` installations are trusted-by-default but flow through the same validator pipeline.

An operator allow/deny policy gates which package names may be installed. By default a matching allowlist entry wins (so you can deny a whole scope yet allow specific exceptions inside it); set `precedence: 'deny-wins'` to consult the deny lists first, so an explicit denylist entry can never be overridden by a broad allowlist glob.

**Operator trust root (D4).** A valid signature is not authenticity if the signer is anyone - a self-signed skill whose inline key is not pinned would otherwise verify green under the signature-required policy. Pass a `trustRoot` (through `installSkillFromNpm` / `installSkillFromGit` or directly to `verifySkillSignature`) and the resolved signing key must be in it, or verification returns `valid: false` with `reason: 'untrusted-key'`:

```ts
await installSkillFromNpm({
  packageName: '@vendor/skill',
  trustRoot: {
    publishers: ['vendor.example.com'],           // trusted publisher ids
    fingerprints: ['sha256:...'],                  // and/or pinned key fingerprints
    allowSigstore: true,                           // sigstore-resolved keys exempt (default)
  },
});
```

The root check runs after the ed25519 signature itself is valid, so the result distinguishes a forged signature from an untrusted signer.

## Lateral-leak defense layer

The agent runtime's defense layer composes orthogonally with the security primitives above:

| Layer | Purpose |
|---|---|
| `causalityMonitor` (`createAgent({ causalityMonitor })`) | Implements an Agentic Reference Monitor pattern. Every cross-agent flow is checked against the stated capability. |
| `mergeGuard` (`createAgent({ mergeGuard })`) | Per-child trust scoring + bias detection on the `'judge-merge'` fan-out strategy; `detect-and-block` refuses the merge (`MergeBlockedError`). |
| Protocol-injection guard (`guardOutboundContent` helper) | Control-character escape catalogue for server-boundary wiring (SSE / session export) - not an `AgentConfig` knob. |
| Commentary-phase trace sanitisation | At the session-output boundary, before any export. |
| Inbound sanitisation preamble | When non-trusted content is in the message list, a locale-resolved preamble is appended **after** the cache breakpoint. |

## Provenance / data-flow policy

The lateral-leak guards above match **patterns**; the data-flow policy (`@graphorin/security/dataflow`, opt-in, toward [CaMeL](https://arxiv.org/abs/2503.18813)) enforces **provenance**. It reuses the metadata Graphorin already attaches to every tool - trust class + source + sensitivity - to defuse the **lethal trifecta**: untrusted content + access to private data + an exfiltration/mutation sink. With all three present in one run, a prompt injection hidden in the untrusted content can drive the sink; the policy makes that flow fail closed (or, in shadow mode, merely report) unless an operator has explicitly declassified it. By default only `sensitivity: 'secret'` content arms the "private data" leg (so the gate does not fire on every run); set `sensitiveTiers: ['secret', 'internal']` on the policy config to also count ordinary user/PII content (which defaults to `'internal'`). Alternatively - or in addition - set `treatPiiAsSensitive: true` so any tool output the PII catalogue flags (email, SSN, card number, …) arms the leg by content, regardless of its declared tier (FIDES-lattice). The verbatim `untrusted-to-sink` leg is independent of both knobs.

```mermaid
flowchart LR
    Out[Tool output] -->|deriveTaintLabel| Ledger[per-run TaintLedger]
    Sink[Sink call] --> Eval[DataFlowPolicy.evaluate]
    Ledger --> Eval
    Eval -->|no taint| Allow[allow]
    Eval -->|shadow| Flag[flag + audit]
    Eval -->|declassified| Declassify[declassify + audit]
    Eval -->|enforce| Block[block]
```

The engine is pure - no I/O, no clock, no network: `deriveTaintLabel(...)` turns a tool's registration metadata into a `TaintLabel`, a per-run `createTaintLedger()` records every output's provenance, and `createDataFlowPolicy({ mode })` returns a verdict for each candidate **sink** (a `side-effecting` / `external-stateful` tool). Untrusted output is tagged from the trust class (`mcp-derived` / `web-search` / `skill-untrusted`); secret-tier output from `sensitivity: 'secret'` only (treating the default `'internal'` tier as sensitive would trip the gate on nearly every run).

A sink trips the policy on any of three signals:

| Signal | Fires when | Precision |
|---|---|---|
| `untrusted-to-sink` | a verbatim span of untrusted content appears in the sink's arguments | precise - direct exfiltration |
| `derived-untrusted-to-sink` | (`derivedTaint: 'strict'`, opt-in) ANY sink fires after untrusted content entered the run - CaMeL-style control-flow integrity, paraphrase-robust by construction | deliberately coarse - size it in shadow mode first |
| `lethal-trifecta` | the sink fires while **both** untrusted **and** secret-tier data have entered the run, even without a provable verbatim carry | conservative - disable with `guardTrifecta: false` |

Three modes (`DataFlowMode`):

| Mode | Behaviour |
|---|---|
| `'off'` | Disabled - every flow allowed. |
| `'shadow'` | Audit-only: a tripped flow emits a `tool:dataflow:flagged` row + counter but never blocks. **Ship this first** to surface false positives against real traffic. |
| `'enforce'` | A tripped flow **blocks** the sink (the call yields a `dataflow_policy_blocked` error, surfaced as `tool.execute.error`) unless the sink's name is in `declassifySinks` - the explicit, audited operator escape hatch (`tool:dataflow:declassified`). |

Findings are **metadata-only** - they name the flow kind and the implicated source kinds, never the raw argument or output bytes. Verbatim detection is best-effort (it catches verbatim / near-verbatim forwarding; paraphrase is what `derivedTaint: 'strict'` and the trifecta signal cover). The policy **composes with code-mode**: each in-script tool call runs through the same sink gate, so an injection cannot exfiltrate through a sandbox either.

Three additional propagation legs close gaps the run-local shingle probe cannot see:

- **Model output** - once a run is tainted, the agent records each step's assistant text as derived-untrusted (`llm-derived`), so a later sink call copying the model's own phrasing still trips the verbatim probe.
- **Memory recall** - the recall tools (`fact_search`, `deep_recall`, `recall_episodes`) attach a taint override when any returned item is quarantined or foreign-provenance, so poisoned memory written in an earlier session re-arms the ledger at recall (the cross-session MINJA leg). Overrides only ever WIDEN a label; nothing can launder an untrusted tool's output.
- **Suspend/resume** - the persisted `RunState.taintSummary` now carries one-way FNV-1a hashes of the tracked spans' tiles alongside the coarse flags, so a resumed run re-detects verbatim copies of pre-suspend untrusted content (at tile granularity) without any untrusted text ever being persisted.

**Pattern catalogues are signal, not gates.** The injection/PII regex catalogues (guardrails, the memory quarantine heuristics, the imperative-pattern strip) now share a Unicode pre-pass (`normalizeForMatching`: NFKC + zero-width strip) so cheap character-injection - zero-width splits, fullwidth homoglyphs - no longer slips past them. They remain best-effort telemetry: adaptive attacks bypass published pattern/classifier defenses at >90% ASR ("The Attacker Moves Second"), so never rely on a catalogue verdict as the sole gate - memory quarantine is reversible by design (`fact_validate`), and the deterministic dataflow policy above is the load-bearing control.

Wire it end-to-end with `createAgent({ dataFlowPolicy: { mode: 'shadow' } })` - see the [agent runtime guide](/guide/agent-runtime#provenance-data-flow-policy-dataflowpolicy) for the full configuration and event details.

## Tool-argument policies & Rule-of-Two (D4)

The data-flow policy above is *detective* (it flags/blocks at the sink after taint is observed). Two *preventive* layers deny disallowed calls before they run, and compose with it:

**Progent-style tool-argument policies** (`AgentConfig.toolPolicy`) are forbid-before-allow rules over the tool name and its validated arguments, evaluated by the executor on every call. A `forbid` verdict blocks the call with a `capability_blocked` outcome (recovery hint `report_to_user`):

```ts
createAgent({
  // ...
  toolPolicy: {
    rules: [
      { effect: 'forbid', tool: 'delete_*', reason: 'destructive ops disabled' },
      { effect: 'forbid', tool: 'transfer', when: (f) => (f.args as any).amount > 1000 },
    ],
    defaultDenySensitive: true, // secret-tier tools need an explicit allow
  },
});
```

A matching `forbid` always beats an `allow`, so narrowing composes safely and a later broad allow can never re-open a denied call.

**Rule-of-Two capability profiles** (`AgentConfig.ruleOfTwo`) declare which of the three lethal-trifecta legs an agent may hold this session: `{ untrustedInput, sensitiveData, externalSideEffects }`. Holding all three is the dangerous configuration; a well-formed profile drops one. Denying `externalSideEffects` forces a read-only capability floor (writer tools are neither advertised nor executable, D2's single-writer gate); denying `sensitiveData` default-denies secret-tier tools. This turns the coarse lethal-trifecta trigger from detective into **preventive** - the third leg is deterministically blocked, not merely flagged.

```ts
createAgent({
  // ...
  // A browsing worker that reads untrusted web content and secrets, but
  // cannot act on the world:
  ruleOfTwo: { untrustedInput: true, sensitiveData: true, externalSideEffects: false },
});
```

The pure decision engines live in `@graphorin/security/policy` (`evaluateToolArgumentPolicy`, `buildRuleOfTwoPolicy`).

## Memory safety: provenance & quarantine

The data-flow policy above governs *tool* I/O within a single run. **Long-living memory** needs its own gate: a fact written today can steer the assistant months later, so a malicious tool result or a confabulated extraction is a *persistent* attack (the memory-poisoning class - MINJA, MemoryGraft). `@graphorin/memory` defends the write path with **provenance** + **quarantine** - distinct from, and complementary to, the tool-I/O provenance above.

Every memory row (fact, episode, insight, induced procedure) carries:

| Field | Values | Meaning |
|---|---|---|
| `provenance` | `user` · `tool` · `extraction` · `reflection` · `induction` · `imported` | Where the memory came from. The middle three are *derived* (synthesised by the consolidator), so they are treated as untrusted by default. |
| `status` | `active` · `quarantined` | Whether the row may drive recall. |

A write lands `status: 'quarantined'` when either:

- its provenance is **derived** (`extraction` / `reflection` / `induction`), or
- it trips the **offline injection heuristics** - `ignore previous instructions`, role-markup smuggling (`<system>`-style tags), or secrecy / exfiltration directives - applied to first-party (`user` / `tool`) candidates.

Quarantined rows are **excluded from default recall** (`fact_search`, auto-recall, and `procedural.activate()` all skip them) but are **never deleted** - quarantine is a retrieval gate, not a purge, so every row stays fully auditable. `fact_remember` reports the quarantine in its output (`quarantined` + a `quarantineReason` of `injection` / `synthesized`), so a poisoned write cannot pass for a normal one.

Promotion is hardened against the model promoting its own poison in a single turn:

- The model-callable **`fact_validate` tool is approval-gated** (`needsApproval: true`) - the run suspends for a human decision before any promotion executes.
- `memory.semantic.validate(...)` **re-checks the fact's text against the injection heuristics and refuses** an injection-flagged row with `QuarantinePromotionRefusedError`. Synthesized-but-clean rows promote once approved; an injection-flagged row is an **operator-only** decision requiring the explicit `{ force: true }` flag from a trusted (non-agent) caller after review. An operator (or review UI) surfaces the queue with the `includeQuarantined` search option; every promotion is audited.

This is the precondition for shipping **synthesised** memory safely. Three derived write-paths all flow through the gate:

- **Reconciliation / extraction** (consolidator standard phase) - extracted facts land `extraction` + quarantined.
- **Reflection / insights** (deep phase) - insights land `reflection` + quarantined, and additionally carry **mandatory citations set from the retrieved evidence** (never hallucinated) and are **rank-capped below the facts they cite**.
- **Workflow induction** (procedural tier) - the highest-risk write, since procedures drive *actions*; induced procedures land `induction` + quarantined and are excluded from `activate()` until a human validates them.

See [Memory system § Memory safety](/guide/memory-system#memory-safety-provenance-quarantine) for the API surface.

## Compaction summary trust

Context compaction is a trust boundary in its own right: the summarizer LLM reads the older portion of the conversation - including tool results wrapped in `<<<untrusted_content>>>` envelopes - and its output is spliced into the live buffer as a `system`-role message the main model treats as authoritative. Without a backstop, that is a classic **injection-laundering** path: text that entered the run untrusted re-enters it as trusted summary prose.

The compactor closes this structurally (CE-15), not just with summarizer prompt wording:

- **Window detection.** If any message in the compacted window carries an `<<<untrusted_content>>>` envelope, the LLM-authored summary body is committed **inside a `trust="derived"` envelope** (`<<<untrusted_content trust="derived" tool="compaction-summarizer">>>`), so the model's standing rule for untrusted blocks - data, not instructions - keeps applying to the summary.
- **Output scan.** Independently of the window, the summarizer's output is run through the offline injection heuristics (the same `ignore previous instructions`-family patterns used by the tool-result sanitizer); a hit degrades the summary to the derived envelope too.
- **No break-out.** Envelope marker sequences inside the summary body are neutralized before wrapping, so summarizer output influenced by injected text cannot close the envelope early and smuggle "system text" after it.
- **Sticky across re-compaction.** A derived summary still carries the envelope when it is itself compacted later, which re-triggers the window detection - taint does not wash out with repeated summarization, consistent with the [data-flow policy](#provenance-data-flow-policy)'s no-laundering rule.

The classification is surfaced as `CompactionResult.summaryTrust` (`'trusted' | 'untrusted-derived'`) for observability. A clean window with a clean summary is committed byte-identically to the pre-CE-15 behaviour.

## Known limitations

These are deliberate, documented gaps - the honest boundary of what the current
release enforces. Each is a design-class change (an operator trust root, a signed
external anchor, a persisted registry) rather than a one-line fix, and is tracked
rather than shipped speculatively.

- **Skill-signature verification proves integrity, not provenance.** `verifySkillSignature` checks that a `SKILL.md` is internally consistent with a key - but for an `inline` key that key comes from the (attacker-authored) frontmatter itself, and for a `well-known` key the pin fingerprint is frontmatter-supplied too. Without an operator-pinned `publicKeySource`, a *self-signed* skill verifies as `signatureVerified: true`. Treat signature verification as integrity-in-transit, not publisher authenticity, until you configure an operator trust root. (Unsigned skills are still rejected outright, and the installer verifies the SKILL.md that actually landed on disk.)
- **The audit chain is tamper-*evident*, not tamper-*resistant*.** It is an unkeyed SHA-256 hash chain with no signing key or external anchor. An actor with write access to the audit database - or a compromised process holding the at-rest passphrase - can delete or rewrite entries and re-root the chain so `verifyAuditChain` still reports clean (`pruneAudit` does exactly this re-rooting by design). It defends only against actors *without* DB write access. Anchor the chain head externally if you need resistance against privileged actors. A prune also rewrites surviving entries' hashes, so hashes archived from an earlier `exportAudit` no longer match the live chain.
- **The installed-skills registry is process-memory only.** `auditInstalledSkills()` reflects only installations performed in the current process; it is not persisted across restarts. Relatedly, the `trusted-with-scripts` trust level is currently unreachable in practice (no folder installer constructs a `{ kind: 'folder' }` source), so skill `postinstall` lifecycles never run.

Smaller residuals tracked alongside these: 1Password Connect / service-account tokens are held as long-lived plain strings (not `SecretValue`); the entity-resolution candidate window is a fixed 1000 most-recent rows; and the verbatim-carry taint probe (not the load-bearing trifecta gate) restarts empty after a durable-HITL suspend.

## Threat model

Graphorin's design assumes a STRIDE threat model across eight trust boundaries:

1. User application <-> Graphorin runtime.
2. Runtime <-> provider adapter.
3. Runtime <-> tool execution.
4. Runtime <-> skill loader.
5. Runtime <-> MCP server.
6. Runtime <-> storage layer.
7. Runtime <-> standalone server (REST / WebSocket / SSE).
8. Standalone server <-> operator (CLI, OAuth flows, audit).

The full threat model is summarised in [Design principles](/reference/design-principles).

## Hardening

The CLI ships `graphorin doctor` - a single command that audits POSIX file modes on the secrets store, the audit log, and the database, plus the systemd unit template (where applicable):

```bash
graphorin doctor
```

Failures are categorised by severity and emit actionable remediation steps.

## Next steps

- [Secrets](/guide/secrets) - `SecretValue`, `SecretRef`, OS keychain, encrypted-file store.
- [Privacy](/guide/privacy) - the no-phone-home contract.
- [Observability](/guide/observability) - redaction + replay sanitisation.
- [Standalone server](/guide/standalone-server) - server-token auth, idempotency.

