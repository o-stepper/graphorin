[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / runTokenVerify

# Function: runTokenVerify()

```ts
function runTokenVerify(options): TokenVerifyResult;
```

Defined in: packages/cli/src/commands/token.ts:311

Offline checksum verification. Confirms the structural shape, the
environment marker, and the CRC checksum but does NOT consult the
token store — it only proves the token was minted by a Graphorin
helper.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`TokenVerifyOptions`](/api/@graphorin/cli/interfaces/TokenVerifyOptions.md) |

## Returns

[`TokenVerifyResult`](/api/@graphorin/cli/interfaces/TokenVerifyResult.md)

## Stable
