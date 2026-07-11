[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / onOAuthLifecycle

# Function: onOAuthLifecycle()

```ts
function onOAuthLifecycle(listener): () => void;
```

Defined in: [packages/security/src/oauth/events.ts:46](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/events.ts#L46)

Subscribe to OAuth lifecycle events. Returns an unsubscribe
function.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `listener` | `OAuthLifecycleListener` |

## Returns

() => `void`

## Stable
