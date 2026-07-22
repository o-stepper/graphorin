[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConflictDecision

# Type Alias: ConflictDecision

```ts
type ConflictDecision = 
  | {
  kind: "admit";
  reason?: string;
  stage: ConflictStage;
}
  | {
  existingId: string;
  kind: "dedup";
  reason?: string;
  similarity?: number;
  stage: ConflictStage;
}
  | {
  existingId: string;
  kind: "supersede";
  reason: string;
  stage: ConflictStage;
}
  | {
  candidateId: string;
  conflictingIds: ReadonlyArray<string>;
  kind: "pending";
  reason?: string;
  similarity?: number;
  stage: ConflictStage;
};
```

Defined in: packages/memory/src/conflict/types.ts:83

**`Stable`**

Final pipeline outcome - discriminated union returned by
[runConflictPipeline](/api/@graphorin/memory/functions/runConflictPipeline.md). Mirrors RB-02 §8.1 / DEC-117 - every
variant carries the originating `stage` so audit + replay tooling
can pattern-match without inspecting the message.

## Union Members

### Type Literal

```ts
{
  kind: "admit";
  reason?: string;
  stage: ConflictStage;
}
```

***

### Type Literal

```ts
{
  existingId: string;
  kind: "dedup";
  reason?: string;
  similarity?: number;
  stage: ConflictStage;
}
```

***

### Type Literal

```ts
{
  existingId: string;
  kind: "supersede";
  reason: string;
  stage: ConflictStage;
}
```

***

### Type Literal

```ts
{
  candidateId: string;
  conflictingIds: ReadonlyArray<string>;
  kind: "pending";
  reason?: string;
  similarity?: number;
  stage: ConflictStage;
}
```

| Name | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| `candidateId` | `string` | The candidate id that was admitted as `pending`. | packages/memory/src/conflict/types.ts:106 |
| `conflictingIds` | `ReadonlyArray`\&lt;`string`\&gt; | Top-K conflicting existing fact ids from Stage 2's vector search. | packages/memory/src/conflict/types.ts:108 |
| `kind` | `"pending"` | - | packages/memory/src/conflict/types.ts:103 |
| `reason?` | `string` | - | packages/memory/src/conflict/types.ts:110 |
| `similarity?` | `number` | - | packages/memory/src/conflict/types.ts:109 |
| `stage` | [`ConflictStage`](/api/@graphorin/memory/type-aliases/ConflictStage.md) | - | packages/memory/src/conflict/types.ts:104 |
