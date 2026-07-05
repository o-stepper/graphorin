---
'@graphorin/core': minor
'@graphorin/agent': minor
---

W-100: `AnyTool` existential type; `createAgent({ tools })` accepts concretely-typed tools without casts.

`Tool` is invariant in `TInput` (the `needsApproval`/`idempotencyKey` predicate properties are contravariant), so a typed `Tool<{q: string}, number, D>` was never assignable to `Tool<unknown, unknown, D>` - forcing `as unknown as Tool<...>` at every collection seam. `@graphorin/core` now exports `AnyTool<TDeps> = Tool<any, any, TDeps>` (existential input/output, following the `HandoffEntry` precedent), and both `AgentConfig.tools` and `PrepareStepOverrides.tools` in `@graphorin/agent` accept `ReadonlyArray<AnyTool<TDeps>>`. Widening only - existing code keeps compiling. `ToolRegistry.register` was already per-call generic and needed no change.
