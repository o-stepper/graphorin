[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / passByBaseCase

# Function: passByBaseCase()

```ts
function passByBaseCase(outcomes): ReadonlyMap<string, boolean>;
```

Defined in: packages/evals/src/stats.ts:175

**`Stable`**

Collapse per-iteration outcomes to per-base-case pass (a base case
passes when EVERY iteration passed) - the paired unit for
[pairedPassSignificance](/api/@graphorin/evals/functions/pairedPassSignificance.md).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `outcomes` | readonly \{ `caseId`: `string`; `pass`: `boolean`; \}[] |

## Returns

`ReadonlyMap`\&lt;`string`, `boolean`\&gt;
