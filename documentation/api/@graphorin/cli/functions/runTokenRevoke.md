[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / runTokenRevoke

# Function: runTokenRevoke()

```ts
function runTokenRevoke(options): Promise<
  | TokenMetadata
| undefined>;
```

Defined in: [packages/cli/src/commands/token.ts:178](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/token.ts#L178)

Revoke a single token.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`TokenRevokeOptions`](/api/@graphorin/cli/interfaces/TokenRevokeOptions.md) |

## Returns

`Promise`\<
  \| [`TokenMetadata`](/api/@graphorin/security/interfaces/TokenMetadata.md)
  \| `undefined`\>

## Stable
