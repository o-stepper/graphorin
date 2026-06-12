---
'@graphorin/agent': patch
'@graphorin/tools': patch
---

fix(agent): the DEC-153 memory-modification guard actually runs (SDF-1)

`buildMemoryGuard(memory)` was called without options, so no
`memoryRegionReader` ever reached the executor and the snapshot/verify cycle —
documented as active — never ran for any guard tier; the `'memory-aware'` tier
returned `null` outright.

With `memory` wired, the runtime now binds a **scope-aware region reader** over
the working-memory tier (the scope resolves lazily from the in-flight run — the
executor only invokes the reader mid-run; reads are best-effort and never fail
the run) and threads it into the executor, so `memory:modification:before` /
`memory:modification:after` audit rows are emitted for guarded tiers. Without
`memory`, the agent emits a **one-time WARN** when any tool declares a
`memoryGuardTier` — the silent no-op is now visible. `tools.md` and the
executor docstring describe the real behavior.
