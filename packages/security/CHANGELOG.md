# @graphorin/security

## 0.6.1

### Patch Changes

- [#142](https://github.com/o-stepper/graphorin/pull/142) [`436d6ca`](https://github.com/o-stepper/graphorin/commit/436d6ca5ebbd16df094e915682d3915c279a8430) Thanks [@o-stepper](https://github.com/o-stepper)! - Version constants and version-bearing strings now derive from each package's manifest at build time (`VERSION = pkg.version`; writer ids, client/server info, OTLP framework attributes, build-info metrics interpolate it). No behavioral change at the current version: the rendered strings are byte-identical. A release bump no longer edits source; the new `check-version-consistency` gate fails any reintroduced hardcoded framework version.

- Updated dependencies [[`436d6ca`](https://github.com/o-stepper/graphorin/commit/436d6ca5ebbd16df094e915682d3915c279a8430)]:
  - @graphorin/core@0.6.1

## 0.6.0

### Minor Changes

- [#136](https://github.com/o-stepper/graphorin/pull/136) [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84) Thanks [@o-stepper](https://github.com/o-stepper)! - Deterministic security adoptions (audit 2026-07-04 Wave C, cluster C6).

  - Derived-taint propagation: opt-in `dataFlowPolicy.derivedTaint: 'strict'` fires the paraphrase-robust `derived-untrusted-to-sink` flow for every model-driven sink call once untrusted content entered the run (CaMeL-style control-flow integrity); the agent also records each tainted step's assistant text as `llm-derived` spans so model-echoed phrasing trips the verbatim probe.
  - Taint into memory (cross-session MINJA leg): `ToolReturn` gains a widen-only `taint` override honoured through the executor record path; `fact_search` / `deep_recall` / `recall_episodes` attach it when any returned item is quarantined or foreign-provenance, re-arming the ledger at recall. `RunState.taintSummary` additionally carries one-way FNV-1a span-tile hashes (no plaintext), so a resumed run re-detects pre-suspend verbatim copies.
  - MCP pinning completed: `toTools({ pinStore })` records fingerprints on first use and REJECTS drift by default when a store is present (rug-pull defense; `onPinMismatch: 'warn'` downgrades); tool-description injection hits at registration are counted (`mcp.tool-description.injection-flagged.total`).
  - Signal-only heuristics + Unicode pre-pass: shared `normalizeForMatching` (NFKC + zero-width strip) applied in the guardrails injection catalogue and the memory quarantine heuristics; security.md repositions all pattern catalogues as best-effort signal, never a sole gate. `TaintLabel.sourceKind` widened to `string` for the new descriptive kinds.

- [#137](https://github.com/o-stepper/graphorin/pull/137) [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627) Thanks [@o-stepper](https://github.com/o-stepper)! - Security hardening (audit 2026-07-04 Wave D, cluster D4) - architectural, deterministic layers.

  - RFC-6962 Merkle transparency over the audit log (`@graphorin/security/audit`): tree head, inclusion + consistency proofs, and Ed25519-signed checkpoints, so anchoring a signed head out-of-band makes the trail tamper-resistant (a rewrite of a checkpointed prefix fails the consistency proof).
  - Operator trust root for skills: `verifySkillSignature`/`installSkillFrom{Npm,Git}` gain `trustRoot` - a valid signature from a key absent from the root returns `valid: false` reason `'untrusted-key'`.
  - Progent-style tool-argument policies + Rule-of-Two capability profiles (`@graphorin/security/policy`): `AgentConfig.toolPolicy` (forbid-before-allow, default-deny sensitive) + `ruleOfTwo` (drops a lethal-trifecta leg, forcing a read-only capability floor) enforced by a new `ExecutorOptions.argumentPolicy` hook (`capability_blocked`).
  - Code-mode sandbox blocklist parity (`bridged-source.ts`) blocks the process-escape modules (child_process/vm/worker_threads/cluster/inspector) via the ESM resolve hook + a CJS `Module._load` patch.

### Patch Changes

- Updated dependencies [[`32f20c1`](https://github.com/o-stepper/graphorin/commit/32f20c110f184f8cef7eec85bf39f5f07c886cb6), [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3), [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627)]:
  - @graphorin/core@0.6.0

## 0.5.0

First version published to the npm registry (with Sigstore build
provenance). The 0.2.0, 0.3.0, and 0.4.0 versions were internal lockstep
milestones and were never published. All `@graphorin/*` packages release
lockstep at the same version; the full release notes for 0.2.0-0.5.0 live
in the repository-level
[CHANGELOG](https://github.com/o-stepper/graphorin/blob/main/CHANGELOG.md).

## 0.1.0

Initial release. See the workspace root `CHANGELOG.md` for the full
release notes; the per-package changelog is generated by Changesets
and tracks subsequent updates.
