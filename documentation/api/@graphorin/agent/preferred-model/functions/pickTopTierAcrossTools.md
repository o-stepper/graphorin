[**Graphorin API reference v0.8.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [preferred-model](/api/@graphorin/agent/preferred-model/index.md) / pickTopTierAcrossTools

# Function: pickTopTierAcrossTools()

```ts
function pickTopTierAcrossTools(hints): 
  | {
  hint: ModelHint;
  spec?: ModelSpec;
}
  | undefined;
```

Defined in: [packages/agent/src/preferred-model/index.ts:84](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/preferred-model/index.ts#L84)

Pick the highest-cost tier across the supplied per-tool hints.
Explicit `ModelSpec` entries are treated as the highest tier
(`'smart'`) for tie-breaking - the conservative-correctness rule
documented in DEC-169 / suggested ADR-057.

Returns the picked hint together with the original `ModelSpec`
(when an explicit spec won the tie-break).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `hints` | readonly ( \| [`ModelSpec`](/api/@graphorin/core/type-aliases/ModelSpec.md) \| [`ModelHint`](/api/@graphorin/core/type-aliases/ModelHint.md) \| `undefined`)[] |

## Returns

  \| \{
  `hint`: [`ModelHint`](/api/@graphorin/core/type-aliases/ModelHint.md);
  `spec?`: [`ModelSpec`](/api/@graphorin/core/type-aliases/ModelSpec.md);
\}
  \| `undefined`

## Stable
