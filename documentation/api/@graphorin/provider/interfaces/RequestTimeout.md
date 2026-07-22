[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / RequestTimeout

# Interface: RequestTimeout

Defined in: packages/provider/src/request-timeout.ts:18

**`Stable`**

Handle returned by [createRequestTimeout](/api/@graphorin/provider/functions/createRequestTimeout.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-fired"></a> `fired` | `readonly` | `boolean` | True once the deadline expired. A caller-initiated abort never sets this - adapters use `fired && req.signal?.aborted !== true` to tell a timeout (throw a retryable `ProviderHttpError`) from a cancellation (surface `finishReason: 'aborted'`). | packages/provider/src/request-timeout.ts:31 |
| <a id="property-signal"></a> `signal` | `readonly` | `AbortSignal` \| `undefined` | Effective signal to hand to the transport: the caller's signal merged with the deadline via `AbortSignal.any`, either alone when only one exists, or `undefined` when neither does. | packages/provider/src/request-timeout.ts:24 |

## Methods

### clear()

```ts
clear(): void;
```

Defined in: packages/provider/src/request-timeout.ts:37

Cancel the deadline. Idempotent. Adapters call this the moment
the call starts producing output (first stream event) and again
in a `finally` so a completed call never leaks a timer.

#### Returns

`void`
