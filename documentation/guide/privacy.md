---
title: Privacy & no-phone-home
description: Zero version pings, zero analytics, zero auto-update calls. The only outbound traffic Graphorin generates is the traffic your code initiates. Verified by a CI check.
---

# Privacy & no-phone-home

Graphorin makes **zero implicit network calls**. The only outbound traffic the framework generates is the traffic your code initiates explicitly:

- LLM provider API calls (`@graphorin/provider`).
- MCP server connections (`@graphorin/mcp`).
- OAuth flows (`@graphorin/security/oauth`).
- The opt-in pricing-snapshot refresh (`graphorin pricing refresh`).
- Embedder / reranker model downloads on first use (`@graphorin/embedder-transformersjs`, `@graphorin/reranker-transformersjs`).
- Storage backend connections (only when an external store is configured).
- The optional OTLP-HTTP exporter (only when the operator wires a collector URL).

There is **no telemetry**, **no version pings**, **no analytics**, **no crash uploads**, and **no auto-update** behaviour anywhere in the framework.

## Verified by CI

The repository ships a `pnpm run check-no-network` script that scans every published package's source tree for forbidden network primitives (`fetch`, `http.request`, `https.request`, `http.get`, `https.get`, `net.createConnection`, `net.connect`, `tls.connect`, `dgram.createSocket`, `WebSocket`, `XMLHttpRequest`, `EventSource`, plus imports of `node-fetch` / `undici` / `got` / `axios` / `ky` / `ws` and their namespaced call forms). The check fails the build the moment a non-allow-listed network call is introduced.

The allow-list is small and explicit - five file-level entries:

| Allow-listed area | Why |
|---|---|
| OAuth flows (`packages/security/src/oauth/`) | Explicit user-initiated authorisation. |
| Skill installer (`packages/security/src/supply-chain/installer.ts`) | Explicit user-initiated skill install. |
| Signature verifier (`packages/security/src/supply-chain/signature.ts`) | Well-known publisher-key fetch during that install. |
| OTLP-HTTP exporter (`packages/observability/src/exporters/otlp-http.ts`) | Only when the operator wires a collector URL. |
| Pricing refresh (`packages/pricing/src/refresh.ts`) | Only on `graphorin pricing refresh` invocation. |

Provider adapters, MCP transports, embedders, and storage backends are **not** allow-listed: they take an injected fetch (`fetchImpl ?? globalThis.fetch`) instead of naming a network primitive in their own source, so their user-initiated traffic (the bullet list above) exists without any scanner exemption.

The CI workflow that runs the check is [`.github/workflows/check-no-network.yml`](https://github.com/o-stepper/graphorin/blob/main/.github/workflows/check-no-network.yml).

## Local-first defaults

| Subsystem | Default behaviour |
|---|---|
| Storage | SQLite file on the user's disk. No remote DB. |
| Embedder | `@huggingface/transformers` running fully in-process. Models downloaded once on first use. |
| Provider | None until you configure one. |
| Tracer | No exporter at all until you wire one via `createTracer(...)` (the repository's example apps opt into a console exporter with `GRAPHORIN_TRACE=console`). |
| Audit log | Encrypted SQLite file on disk. |
| Secrets | OS keychain (when available). |
| Updates | Manual. Graphorin never pings npm or any other endpoint to check for new versions. |

## Sensitivity-aware payloads

`createProvider(adapter, { acceptsSensitivity })` is the **first-run sensitivity prompt**. The default for an unfamiliar provider is **deny everything except `public`** until you opt in. Memory rows tagged `secret` are filtered before any payload reaches the adapter, regardless of the configuration.

Sensitivity governs *who may see* a memory. It is orthogonal to **provenance / quarantine**, which governs *whether a memory is trusted enough to recall at all* - synthesised or injection-flagged rows are quarantined out of recall until a human validates them. See [Security § Memory safety](/guide/security#memory-safety-provenance-quarantine).

## Verifying the contract yourself

Set `GRAPHORIN_OFFLINE=1` and run any of the example apps in the repository. The runtime refuses to phone home; the example harness turns a recipe that tries to reach a configured local endpoint (e.g. an Ollama daemon) into a typed `OfflineRecipeUnreachableError` with a helpful remediation message.

```bash
GRAPHORIN_OFFLINE=1 GRAPHORIN_LLM_RECIPE=stub \
  pnpm --filter ./examples/personal-assistant-cli dev
```

Network sniffers (`lsof -i -nP | grep node`, `tcpdump`, `Wireshark`) should show traffic only to the endpoints you explicitly configured - never beyond.

## Erasure and retention

Deletion in a memory-bearing framework spans roughly a dozen persistence surfaces. This table is the reference for which primitive covers each one; the canonical, machine-checked source of truth for the session cascade is the exported `SESSION_SCOPED_PURGES` registry in `@graphorin/store-sqlite` and its schema-introspection gate test (any new table with a session column fails the suite until it gets an erasure decision).

| Surface | What it stores | Deleted by | Not covered by |
|---|---|---|---|
| `sessions`, `session_messages`, `episodes` (+ FTS/vec rows) | conversation transcript and episode summaries | `deleteSession` / `pruneSessions` cascade | - |
| `facts`, `insights`, `rules` (+ FTS/vec rows, entity links) | distilled memory | session-scoped rows: the same cascade; user-scoped rows: `MemoryStore.purge(id)` per record | a session delete never touches user-level rows (`scope_session_id IS NULL`) |
| `working_blocks` (incl. the user-scoped `profile` projection block) | working blocks / projected profile slots | session-scoped rows: the same cascade; user-scoped rows: `memory.working.purge(userScope, label)` (hard delete; `forget()` is only a tombstone) | a session delete never touches user-scoped blocks - the `profile` block deliberately survives session deletion and MUST be purged explicitly during user erasure |
| `memory_history` | audit trail of memory mutations | values are scrubbed to event skeletons by the cascade and by `purge()`; row skeletons remain | full row deletion (use `graphorin memory prune-history --older-than`) |
| `workflow_checkpoints`, `workflow_pending_writes` | suspended-run snapshots (full serialized conversation) | session cascade (via the `sessionId` metadata stamped on HITL suspends and the workflow-run mapping); age-based: `CheckpointStoreExt.pruneThreads`; per-thread: `deleteThread` / `compactThread` | - |
| `spans` | run traces (tool names, error strings, memory-search ids) | session cascade; age-based: `graphorin traces prune --before` / `pruneSpans` | spans with no session id are only deleted by age |
| `idempotency_records` | request-replay keys | the server's unified retention scheduler (expired rows; default sweep interval 6 h) | - |
| `consolidator_runs`, `consolidator_failed_batches` | consolidation run log + dead-letter queue | `pruneRuns` / `pruneExhaustedBatches`; `graphorin consolidator dlq-clear` | batches still awaiting retry (explicit flag required) |
| `session_audit` / `audit.db` | lifecycle + security audit chains | `pruneAuditEntries(beforeEpochMs)`; `graphorin audit prune` (re-anchors the Merkle chain - see the runbook in [Security](/guide/security)) | - |
| spill artifacts (`graphorin-spill:...`) | oversized tool results | cleared on terminal runs; startup TTL sweep (7 days) for orphans | - |
| encryption backups (`*.bak.*`) | point-in-time database copies | `graphorin storage cleanup-backups` | **erasure does not propagate into existing backups** (see below) |

### Backups do not forget

`graphorin storage backup` takes a point-in-time copy. Deleting a session (or purging a fact) afterwards changes the live database only - every backup taken before the deletion still contains the data. Two operational rules follow: keep backup retention no longer than your erasure obligations, and re-run the erasure after any restore from a pre-deletion backup. The same applies to the timestamped `.bak.<ts>` files that `storage encrypt --swap` leaves behind.

### Erasing a person end-to-end

1. `listSessions({ userId })` on the sessions facade (or `GET /v1/sessions?userId=...`), then `deleteSession(id)` for each - the cascade removes transcripts, episodes, session-scoped facts/insights/rules/blocks, suspended-run checkpoints and spans.
2. Purge user-scoped memory: enumerate the user's remaining facts/insights/rules (they carry `scope_user_id`) and call `MemoryStore.purge(id)` per record - this also scrubs `memory_history` values. Then hard-delete the user-scoped working blocks: `memory.working.purge({ userId }, 'profile')` (and any other user-level labels) - the soft `forget()` tombstone is not erasure.
3. Sweep the residuals: `graphorin traces prune` for any unsessioned spans in the retention window, `graphorin audit prune` if the audit chain must forget (mind the Merkle re-anchor runbook), `graphorin memory prune-history` for history skeletons.
4. Apply the backup caveat above to every backup that predates the erasure.

## Reporting a regression

If you believe you have observed Graphorin making a network call that the runtime did not invite, please open an issue on GitHub or report it privately per the [Security policy](/contributing/security).

## Next steps

- [Security](/guide/security) - sandbox + audit log + supply chain.
- [Observability](/guide/observability) - redaction layer.
- [Standalone server](/guide/standalone-server) - health checks + Prometheus metrics.

