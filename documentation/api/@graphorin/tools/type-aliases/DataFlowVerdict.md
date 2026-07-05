[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / DataFlowVerdict

# Type Alias: DataFlowVerdict

```ts
type DataFlowVerdict = 
  | {
  action: "allow";
}
  | {
  action: "flag" | "declassify" | "block";
  flow: string;
  reason: string;
  sourceKinds: ReadonlyArray<string>;
};
```

Defined in: packages/tools/src/executor/types.ts:245

Verdict returned by [DataFlowGuard.inspect](/api/@graphorin/tools/interfaces/DataFlowGuard.md#inspect). Mirrors
`@graphorin/security`'s `DataFlowDecision`; the agent maps one to the
other so the executor takes no security dependency.

- `'allow'`      - proceed silently.
- `'flag'`       - shadow-mode detection: audit, then proceed.
- `'declassify'` - operator-authorized tainted flow: audit, then proceed.
- `'block'`      - enforce-mode block: surface `dataflow_policy_blocked`.
