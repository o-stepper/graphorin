[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ContextTokenCounter

# Interface: ContextTokenCounter

Defined in: packages/memory/src/context-engine/token-counter.ts:27

Pluggable text-token counter used inside the ContextEngine. The
surface is narrower than [TokenCounter](/api/@graphorin/core/interfaces/TokenCounter.md) because the engine
never assembles a message list during the budget-allocation
phase — it operates on rendered text fragments.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | packages/memory/src/context-engine/token-counter.ts:28 |

## Methods

### countText()

```ts
countText(text): Promise<number>;
```

Defined in: packages/memory/src/context-engine/token-counter.ts:29

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |

#### Returns

`Promise`\&lt;`number`\&gt;
