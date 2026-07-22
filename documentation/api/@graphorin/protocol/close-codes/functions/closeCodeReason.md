[**Graphorin API reference v0.15.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/protocol](/api/@graphorin/protocol/index.md) / [close-codes](/api/@graphorin/protocol/close-codes/index.md) / closeCodeReason

# Function: closeCodeReason()

```ts
function closeCodeReason(code): 
  | GraphorinCloseReason
  | undefined;
```

Defined in: src/close-codes.ts:65

**`Stable`**

Resolve a numeric close code back to its Graphorin reason
discriminator. Returns `undefined` for codes outside the
Graphorin range so callers can still surface the raw RFC 6455
reason for unrelated codes.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `code` | `number` |

## Returns

  \| [`GraphorinCloseReason`](/api/@graphorin/protocol/close-codes/type-aliases/GraphorinCloseReason.md)
  \| `undefined`
