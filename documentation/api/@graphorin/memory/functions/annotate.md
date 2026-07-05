[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / annotate

# Function: annotate()

```ts
function annotate(origin, inboundTrust): ContentAnnotation;
```

Defined in: packages/memory/src/context-engine/annotations.ts:125

Build an annotation, enforcing the rule that
non-tool-result origins always carry `inboundTrust: 'n/a'`. A
caller that requests a non-`'n/a'` value for a non-inbound origin
is silently corrected (defense-in-depth: the rule is enforced
here so callers cannot accidentally violate it).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `origin` | [`ContentOrigin`](/api/@graphorin/memory/type-aliases/ContentOrigin.md) |
| `inboundTrust` | [`InboundTrust`](/api/@graphorin/memory/type-aliases/InboundTrust.md) |

## Returns

[`ContentAnnotation`](/api/@graphorin/memory/interfaces/ContentAnnotation.md)

## Stable
