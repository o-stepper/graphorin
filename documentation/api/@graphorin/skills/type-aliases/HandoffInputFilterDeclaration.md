[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [](/api/@graphorin/skills/README.md) / HandoffInputFilterDeclaration

# Type Alias: HandoffInputFilterDeclaration

```ts
type HandoffInputFilterDeclaration = 
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
  kind: "full";
}
  | {
  kind: "compose";
  steps: ReadonlyArray<HandoffInputFilterStep>;
};
```

Defined in: packages/skills/src/types/index.ts:205

**`Stable`**

`graphorin-handoff-input-filter` declaration recognised by the
loader. The runtime resolves the declaration into the actual filter
implementation in Phase 12; the loader only validates the shape.
