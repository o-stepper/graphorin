[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ReconcileDecision

# Type Alias: ReconcileDecision

```ts
type ReconcileDecision = 
  | {
  action: "add";
  reason?: string;
}
  | {
  action: "update";
  reason: string;
  targetId: string;
}
  | {
  action: "noop";
  reason?: string;
  targetId: string;
}
  | {
  action: "conflict";
  reason: string;
  targetId: string;
};
```

Defined in: packages/memory/src/conflict/types.ts:243

**`Stable`**

Outcome of `reconcileCandidate`. `add` is independent / unsure
(a fresh fact); `noop` is a duplicate that adds nothing; `update` is
a newer version of `targetId`; `conflict` contradicts `targetId` and
closes it. The three neighbour-referencing variants carry the
`targetId` of the existing fact they resolve against.
