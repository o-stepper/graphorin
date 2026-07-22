[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / goldTokenCoverage

# Function: goldTokenCoverage()

```ts
function goldTokenCoverage(gold, observed): number;
```

Defined in: packages/evals/src/scorers/memory/util.ts:131

**`Stable`**

Directional containment: the fraction of the gold point's CONTENT
tokens (function words stripped) present in the observed text; `1`
means every content-bearing gold token appears. Falls back to the
full token set when stripping would leave nothing.

Deep-retest 0.13.7 P2: symmetric [tokenF1](/api/@graphorin/evals/functions/tokenF1.md) punishes verbosity
- gold `User is pescatarian` against the semantically correct `The
user started eating fish again on 2026-01-20, so the user
identifies as pescatarian.` scores F1 `0.235` and was graded missed
+ hallucinated + omitted at once; its gold coverage is `1`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `gold` | `string` |
| `observed` | `string` |

## Returns

`number`
