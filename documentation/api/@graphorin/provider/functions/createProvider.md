[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / createProvider

# Function: createProvider()

```ts
function createProvider(adapter, options?): Provider;
```

Defined in: packages/provider/src/provider.ts:74

**`Stable`**

Wrap an adapter in the canonical `Provider` shape. Adapters returned
by the bundled factories already implement `Provider`; passing them
through `createProvider(...)` is the recommended entry point because
it keeps the construction site documented and gives downstream
middleware a single attachment surface.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `adapter` | [`Provider`](/api/@graphorin/core/interfaces/Provider.md) |
| `options` | [`CreateProviderOptions`](/api/@graphorin/provider/interfaces/CreateProviderOptions.md) |

## Returns

[`Provider`](/api/@graphorin/core/interfaces/Provider.md)

## Example

```ts
const provider = createProvider(vercelAdapter(model), {
  acceptsSensitivity: ['public', 'internal'],
});
```
