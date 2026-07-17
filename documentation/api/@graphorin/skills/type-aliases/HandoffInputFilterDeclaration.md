[**Graphorin API reference v0.10.2**](../../../index.md)

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

Defined in: [packages/skills/src/types/index.ts:205](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/types/index.ts#L205)

`graphorin-handoff-input-filter` declaration recognised by the
loader. The runtime resolves the declaration into the actual filter
implementation in Phase 12; the loader only validates the shape.

## Stable
