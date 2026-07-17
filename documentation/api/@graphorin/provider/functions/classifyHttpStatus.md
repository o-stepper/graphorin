[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / classifyHttpStatus

# Function: classifyHttpStatus()

```ts
function classifyHttpStatus(status, bodyText?): ProviderErrorKind;
```

Defined in: [packages/provider/src/errors/errors.ts:229](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/errors/errors.ts#L229)

Map an HTTP status (plus optional error-body text) onto the
canonical `ProviderErrorKind`. One
shared table so `withRetry` / `withFallback` and consumers switching
on the documented kinds see consistent values from every HTTP
adapter:

- `429` → `'rate-limit'`
- `401` / `403` → `'unauthorized'`
- `400` / `404` / `422` → `'invalid-request'` (or
  `'context-length'` when the body says so)
- `503` / `529` → `'capacity'` (529 is Anthropic's overloaded code)
- other `5xx` and `0` (network failure) → `'transient'`

## Parameters

| Parameter | Type |
| ------ | ------ |
| `status` | `number` |
| `bodyText?` | `string` |

## Returns

[`ProviderErrorKind`](/api/@graphorin/core/type-aliases/ProviderErrorKind.md)

## Stable
