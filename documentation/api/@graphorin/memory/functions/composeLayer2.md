[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / composeLayer2

# Function: composeLayer2()

```ts
function composeLayer2(instructions): string;
```

Defined in: packages/memory/src/context-engine/templates/composer.ts:37

**`Stable`**

Render the optional Layer 2 (`agent_instructions`) wrapper.
Returns the empty string when `instructions` is empty so the
layer is dropped from the assembled prompt.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `instructions` | `string` \| `undefined` |

## Returns

`string`
