[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / StageOutcome

# Type Alias: StageOutcome

```ts
type StageOutcome = 
  | {
  kind: "continue";
}
  | {
  kind: "admit";
  reason?: string;
}
  | {
  existingId: string;
  kind: "dedup";
  reason?: string;
  similarity?: number;
}
  | {
  existingId: string;
  kind: "supersede";
  reason: string;
}
  | {
  conflictingIds: ReadonlyArray<string>;
  kind: "pending";
  reason?: string;
  similarity?: number;
};
```

Defined in: [packages/memory/src/conflict/types.ts:161](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/conflict/types.ts#L161)

Per-stage outcome surfaced to the orchestrator. `'admit'` means the
stage decided not to short-circuit - the pipeline continues to the
next stage. Every other variant terminates the pipeline.

## Stable
