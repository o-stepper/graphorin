[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / isForeignProvenance

# Function: isForeignProvenance()

```ts
function isForeignProvenance(provenance): boolean;
```

Defined in: packages/memory/src/search/trust.ts:30

`true` for provenance that did not originate first-party (P1-4) —
mirrors the eviction-path classification: `null` (legacy / direct
write), `'user'`, and `'extraction'` (the consolidator distilling the
user's own session) are first-party; `'tool'`, `'imported'`,
`'reflection'`, and `'induction'` are foreign.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `provenance` | `string` \| `null` \| `undefined` |

## Returns

`boolean`

## Stable
