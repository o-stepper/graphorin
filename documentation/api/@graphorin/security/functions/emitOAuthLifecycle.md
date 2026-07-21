[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / emitOAuthLifecycle

# Function: emitOAuthLifecycle()

```ts
function emitOAuthLifecycle(event): void;
```

Defined in: packages/security/src/oauth/events.ts:64

**`Stable`**

Emit a lifecycle event. Listeners that throw are isolated from the
OAuth fast path.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | [`OAuthLifecycleEvent`](/api/@graphorin/security/interfaces/OAuthLifecycleEvent.md) |

## Returns

`void`
