[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / ApprovalDecision

# Type Alias: ApprovalDecision

```ts
type ApprovalDecision = 
  | {
  granted: true;
}
  | {
  granted: false;
  reason?: string;
};
```

Defined in: packages/tools/src/executor/types.ts:288

Approval gate decision.
