[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / registerOAuthStrategy

# Function: registerOAuthStrategy()

```ts
function registerOAuthStrategy(strategy): () => void;
```

Defined in: packages/security/src/oauth/strategies.ts:20

Register a strategy. Returns an unsubscribe function so tests can
tear the registration down.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `strategy` | [`OAuthStrategy`](/api/@graphorin/security/interfaces/OAuthStrategy.md) |

## Returns

() => `void`

## Stable
