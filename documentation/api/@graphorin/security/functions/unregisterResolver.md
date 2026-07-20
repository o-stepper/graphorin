[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / unregisterResolver

# Function: unregisterResolver()

```ts
function unregisterResolver(scheme): boolean;
```

Defined in: packages/security/src/secrets/resolvers/registry.ts:92

**`Stable`**

Remove a registered resolver. Returns `true` if a resolver was
removed. Tests use this to isolate fixtures.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `scheme` | `string` |

## Returns

`boolean`
