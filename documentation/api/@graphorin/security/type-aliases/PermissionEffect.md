[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / PermissionEffect

# Type Alias: PermissionEffect

```ts
type PermissionEffect = "allow" | "deny" | "ask" | "defer";
```

Defined in: packages/security/src/policy/tool-argument-policy.ts:70

**`Stable`**

Four-value permission vocabulary (E1 / item 11):

- `'allow'` - the call may run.
- `'deny'`  - the call must not run (deterministic block).
- `'ask'`   - the call needs a human decision BEFORE it runs; only a
  surface that can durably suspend (the agent pre-screen) can honour
  it - a bare executor fails it closed.
- `'defer'` - the decision is parked for ASYNCHRONOUS resolution
  (messenger button, workflow awakeable) with a timeout that
  auto-denies; like `'ask'`, honoured only by a suspending surface.

Priority when several rules match: `deny > defer > ask > allow`.
