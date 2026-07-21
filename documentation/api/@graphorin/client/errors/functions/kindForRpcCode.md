[**Graphorin API reference v0.13.10**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/client](/api/@graphorin/client/index.md) / [errors](/api/@graphorin/client/errors/index.md) / kindForRpcCode

# Function: kindForRpcCode()

```ts
function kindForRpcCode(code): GraphorinClientErrorKind;
```

Defined in: packages/client/src/errors.ts:18

Map a JSON-RPC error code from a server `RpcFailure` frame to the
client's discriminated [GraphorinClientErrorKind](/api/@graphorin/client/errors/type-aliases/GraphorinClientErrorKind.md), so a rate-limited
or scope-denied RPC is distinguishable from a genuine protocol violation.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `code` | `number` |

## Returns

[`GraphorinClientErrorKind`](/api/@graphorin/client/errors/type-aliases/GraphorinClientErrorKind.md)
