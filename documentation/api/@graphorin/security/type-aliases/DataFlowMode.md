[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / DataFlowMode

# Type Alias: DataFlowMode

```ts
type DataFlowMode = "off" | "shadow" | "enforce";
```

Defined in: packages/security/src/dataflow/types.ts:38

**`Stable`**

Operating mode for [DataFlowPolicy](/api/@graphorin/security/interfaces/DataFlowPolicy.md).

- `'off'`     - disabled; every flow is allowed (the engine is never
  constructed in this mode by the agent, but the value exists so a
  config can disable the feature without becoming `undefined`).
- `'shadow'`  - audit-only: tainted flows are *flagged* (an audit row +
  counter) but never blocked. Ship this first to surface false
  positives against real traffic before enforcing.
- `'enforce'` - tainted flows are *blocked* (the sink does not run)
  unless the sink is operator-declassified.
