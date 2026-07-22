[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [](/api/@graphorin/skills/README.md) / HandoffInputFilterStep

# Type Alias: HandoffInputFilterStep

```ts
type HandoffInputFilterStep = 
  | {
  kind: "lastUser";
}
  | {
  kind: "lastN";
  n: number;
}
  | {
  kind: "summary";
}
  | {
  keepTier?: string;
  kind: "stripSensitiveOutputs";
}
  | {
  kind: "stripReasoning";
};
```

Defined in: packages/skills/src/types/index.ts:222

**`Stable`**

Composable step recognised inside `graphorin-handoff-input-filter:
{ compose: [...] }`. The runtime resolves named steps into actual
filter implementations in Phase 12.
