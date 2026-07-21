[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / composeInboundPreamble

# Function: composeInboundPreamble()

```ts
function composeInboundPreamble(pack): string;
```

Defined in: packages/memory/src/context-engine/templates/composer.ts:81

**`Stable`**

Render the inbound-sanitization preamble fragment. Emitted
AFTER the cache breakpoint so the Layer 1-4 cache prefix is
unaffected. Caller threads the fragment into the system content
post-Layer 5; the fragment is returned as a string so the
caller does not need to know the cache-breakpoint policy.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `pack` | [`ContextLocalePack`](/api/@graphorin/memory/interfaces/ContextLocalePack.md) |

## Returns

`string`
