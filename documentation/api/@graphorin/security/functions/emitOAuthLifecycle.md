[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / emitOAuthLifecycle

# Function: emitOAuthLifecycle()

```ts
function emitOAuthLifecycle(event): void;
```

Defined in: [packages/security/src/oauth/events.ts:59](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/events.ts#L59)

Emit a lifecycle event. Listeners that throw are isolated from the
OAuth fast path.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | [`OAuthLifecycleEvent`](/api/@graphorin/security/interfaces/OAuthLifecycleEvent.md) |

## Returns

`void`

## Stable
