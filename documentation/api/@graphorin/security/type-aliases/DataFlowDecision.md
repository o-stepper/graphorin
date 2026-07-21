[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / DataFlowDecision

# Type Alias: DataFlowDecision

```ts
type DataFlowDecision = 
  | {
  action: "allow";
}
  | {
  action: "flag" | "declassify" | "block";
} & DataFlowFinding;
```

Defined in: packages/security/src/dataflow/types.ts:310

**`Stable`**

The verdict [DataFlowPolicy.evaluate](/api/@graphorin/security/interfaces/DataFlowPolicy.md#evaluate) returns for a sink call.

- `'allow'`       - no tainted flow (or the policy is off / the tool is
  not a sink); proceed silently.
- `'flag'`        - tainted flow detected in `'shadow'` mode: audit but
  proceed.
- `'declassify'`  - tainted flow into an operator-declassified sink:
  audit and proceed (the audited escape hatch).
- `'block'`       - tainted flow in `'enforce'` mode: do not run the
  sink; surface a `dataflow_policy_blocked` error.
