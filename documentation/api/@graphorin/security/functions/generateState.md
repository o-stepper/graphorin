[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / generateState

# Function: generateState()

```ts
function generateState(byteLength?): string;
```

Defined in: packages/security/src/oauth/pkce.ts:55

**`Stable`**

Generate a cryptographically random `state` parameter.

## Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `byteLength` | `number` | `16` |

## Returns

`string`
