[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / reconcileToConflictDecision

# Function: reconcileToConflictDecision()

```ts
function reconcileToConflictDecision(decision): ConflictDecision;
```

Defined in: [packages/memory/src/conflict/types.ts:238](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/conflict/types.ts#L238)

Map a [ReconcileDecision](/api/@graphorin/memory/type-aliases/ReconcileDecision.md) onto the existing [ConflictDecision](/api/@graphorin/memory/type-aliases/ConflictDecision.md)
so reconcile outcomes land in `fact_conflicts` through the same audit
path as the inline pipeline (no new stage / schema): `add` → `admit`,
`noop` → `dedup`, `update` / `conflict` → `supersede`. All reconcile
decisions are stamped with the `defer-to-deep` stage - the reconcile
loop is the consolidator's replacement for the deferred deep-judge
step it supersedes.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `decision` | [`ReconcileDecision`](/api/@graphorin/memory/type-aliases/ReconcileDecision.md) |

## Returns

[`ConflictDecision`](/api/@graphorin/memory/type-aliases/ConflictDecision.md)

## Stable
