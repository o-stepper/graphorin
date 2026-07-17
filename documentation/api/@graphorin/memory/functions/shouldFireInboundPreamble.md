[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / shouldFireInboundPreamble

# Function: shouldFireInboundPreamble()

```ts
function shouldFireInboundPreamble(annotations): boolean;
```

Defined in: [packages/memory/src/context-engine/annotations.ts:155](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/annotations.ts#L155)

Decide whether the per-step inbound-sanitization preamble (D4)
should fire for an assembled message list. The preamble fires
iff at least one part carries an inbound-trust value other than
`'trusted'` and `'n/a'`. Trusted-only steps skip the preamble for
cache-friendliness; preamble is emitted exactly once per step
regardless of how many untrusted parts the step carries.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `annotations` | readonly [`ContentAnnotation`](/api/@graphorin/memory/interfaces/ContentAnnotation.md)[] |

## Returns

`boolean`

## Stable
