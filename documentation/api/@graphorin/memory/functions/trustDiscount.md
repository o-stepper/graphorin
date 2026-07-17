[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / trustDiscount

# Function: trustDiscount()

```ts
function trustDiscount(record, weights?): number;
```

Defined in: [packages/memory/src/search/trust.ts:48](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/search/trust.ts#L48)

Rank-time trust multiplier for one record. `1` for first-party active
facts (the common case - zero ranking change), `1 - quarantine` for
quarantined-but-included rows, `1 - foreignProvenance` for foreign
origin. Quarantine wins when both apply (same branch order as
`salience()`).

## Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `record` | \{ `provenance?`: `string` \| `null`; `status?`: `string`; \} | `undefined` |
| `record.provenance?` | `string` \| `null` | `undefined` |
| `record.status?` | `string` | `undefined` |
| `weights` | `SalienceWeights` | `DEFAULT_SALIENCE_WEIGHTS` |

## Returns

`number`

## Stable
