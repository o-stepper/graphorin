[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / checkSuccessCriteria

# Function: checkSuccessCriteria()

```ts
function checkSuccessCriteria(procedure, observed): VerificationResult;
```

Defined in: packages/memory/src/consolidator/phases/induce.ts:324

Self-verify a reuse against an induced procedure's success criteria. A
criterion is met when any observed signal contains it (case-insensitive
substring) - a deterministic, offline check the agent runtime can feed
actual run observations into on reuse. With **no criteria**, the reuse
cannot be self-verified, so `verified` is `false`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `procedure` | \{ `successCriteria?`: readonly `string`[]; \} |
| `procedure.successCriteria?` | readonly `string`[] |
| `observed` | readonly `string`[] |

## Returns

[`VerificationResult`](/api/@graphorin/memory/interfaces/VerificationResult.md)
