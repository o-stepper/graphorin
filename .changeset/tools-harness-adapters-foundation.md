---
'@graphorin/agent': patch
---

Add the tool-executor integration adapters (WI-01) under
`@graphorin/agent`'s internal `src/tooling/adapters.ts`. These are the
typed glue that lets the `@graphorin/tools` executor consume the agent's
`@graphorin/security` / `@graphorin/memory` / `@graphorin/provider`
surfaces. They are built and unit-tested in isolation ahead of wiring the
executor into the run loop (WI-03):

- **`buildSecretResolver`** — the executor's `secretResolver` value hook.
  ACL enforcement (`enforceSecretAcl`) and scoping
  (`withChildToolSecretsContext`) stay in the executor's secrets accessor,
  so this adapter only resolves a key to a `SecretValue | null`.
- **`buildSandboxResolver`** — maps a `ResolvedSandboxPolicy.kind` to a
  cached `SandboxImpl` (one lazily-constructed instance per kind; `'none'`
  and unrecognised kinds run inline). Factories are injectable so unit
  runs never spawn real worker threads / containers.
- **`buildMemoryGuard`** + **`createMemoryRegionReader`** — the
  `memoryGuardFactory` (via `createGuard`) and an injectable, scope-bound
  `memoryRegionReader`; returns a null factory and no reader when `memory`
  is `undefined`, so the executor degrades to its audit-only baseline.
- **`buildToolTokenCounter`** — the synchronous truncation token counter
  (the `@graphorin/tools` heuristic by default, or an injectable sync
  tokenizer; never the provider's async counter on the truncation path).
- **`createExecutorEventBridge`** — a bounded async queue bridging the
  executor's synchronous `streamingSink` to an `AsyncIterableIterator`
  the run loop can drain (with oldest-dropped backpressure + close
  semantics).

Internal only — nothing is exported from the package entrypoint yet, so
there is no public API change.
