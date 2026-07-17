[**Graphorin API reference v0.12.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [outbound](/api/@graphorin/tools/outbound/index.md) / sha256Hex

# Function: sha256Hex()

```ts
function sha256Hex(value): string;
```

Defined in: [packages/tools/src/outbound/commentary-patterns.ts:193](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/outbound/commentary-patterns.ts#L193)

Hex-encoded SHA-256 of a UTF-8 string. Used for the before/after
digests on sanitization audit rows (raw payloads never reach the
audit log).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `string` |

## Returns

`string`

## Stable
