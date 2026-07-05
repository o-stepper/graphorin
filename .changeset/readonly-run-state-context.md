---
'@graphorin/core': minor
'@graphorin/agent': patch
---

W-047: `RunContext.state` is now typed as the new `ReadonlyRunState` projection.

Tools and hooks observe the run; they do not mutate its bookkeeping - assignments to `status`/`finishedAt` and `push`/`splice` on `steps`/`messages`/`pendingApprovals` through `ctx.state` are now compile errors. `ReadonlyRunState` is a hand-written structural mirror of `RunState` (keyof parity pinned by type tests); `RunState` remains assignable to it, so runtime call sites needed no changes. This is a compile-time contract only (no runtime freeze). BREAKING at the type level for tools that wrote to `ctx.runContext.state` - that was never supported. Companion cleanup in `@graphorin/agent`: `finishRunBase`/`finalize` take `MutableRunState & RunState`, removing the last `as unknown as RunState` cast in the runtime.
