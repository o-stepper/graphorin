[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / runSecretsRef

# Function: runSecretsRef()

```ts
function runSecretsRef(options): Promise<SecretsRefResult>;
```

Defined in: packages/cli/src/commands/secrets.ts:213

**`Stable`**

Test resolution of a `SecretRef` URI. The CLI parses the URI first
(sanity check + scheme echo), then resolves through the registered
resolver chain.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`SecretsRefOptions`](/api/@graphorin/cli/interfaces/SecretsRefOptions.md) |

## Returns

`Promise`\&lt;[`SecretsRefResult`](/api/@graphorin/cli/interfaces/SecretsRefResult.md)\&gt;
