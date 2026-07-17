[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/protocol](/api/@graphorin/protocol/index.md) / close-codes

# close-codes

Custom WebSocket close-code taxonomy used by `@graphorin/server`
and `@graphorin/client`. The numeric values live in the 4xxx
application-private range per RFC 6455 § 7.4.

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [GraphorinCloseReason](/api/@graphorin/protocol/close-codes/type-aliases/GraphorinCloseReason.md) | Discriminator for every Graphorin-defined close code. The matching numeric value is exposed via [CLOSE\_CODE\_VALUES](/api/@graphorin/protocol/close-codes/variables/CLOSE_CODE_VALUES.md). |

## Variables

| Variable | Description |
| ------ | ------ |
| [CLOSE\_CODE\_VALUES](/api/@graphorin/protocol/close-codes/variables/CLOSE_CODE_VALUES.md) | Numeric close-code constants. The pair `(value, reason)` round-trips via [closeCodeReason](/api/@graphorin/protocol/close-codes/functions/closeCodeReason.md) / [closeCodeFor](/api/@graphorin/protocol/close-codes/functions/closeCodeFor.md). |

## Functions

| Function | Description |
| ------ | ------ |
| [closeCodeFor](/api/@graphorin/protocol/close-codes/functions/closeCodeFor.md) | Return the numeric close code for a Graphorin reason discriminator. |
| [closeCodeReason](/api/@graphorin/protocol/close-codes/functions/closeCodeReason.md) | Resolve a numeric close code back to its Graphorin reason discriminator. Returns `undefined` for codes outside the Graphorin range so callers can still surface the raw RFC 6455 reason for unrelated codes. |
