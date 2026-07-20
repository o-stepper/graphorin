[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / tryProtectedResourceMetadata

# Function: tryProtectedResourceMetadata()

```ts
function tryProtectedResourceMetadata(resourceUrl, signal?): Promise<
  | ProtectedResourceMetadata
| undefined>;
```

Defined in: packages/security/src/oauth/discovery.ts:118

**`Stable`**

Try to resolve protected-resource metadata (RFC 9728). Returns
`undefined` when the resource does not advertise the document.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `resourceUrl` | `string` |
| `signal?` | `AbortSignal` |

## Returns

`Promise`\<
  \| [`ProtectedResourceMetadata`](/api/@graphorin/security/interfaces/ProtectedResourceMetadata.md)
  \| `undefined`\>
