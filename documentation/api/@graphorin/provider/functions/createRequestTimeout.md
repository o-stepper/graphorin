[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / createRequestTimeout

# Function: createRequestTimeout()

```ts
function createRequestTimeout(args): RequestTimeout;
```

Defined in: packages/provider/src/request-timeout.ts:53

**`Stable`**

Arm a deadline of `timeoutMs` milliseconds composed with an
optional caller signal. `timeoutMs` unset or `0` disables the
deadline (the caller signal, when present, still passes through).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | \{ `signal?`: `AbortSignal`; `timeoutMs?`: `number`; \} |
| `args.signal?` | `AbortSignal` |
| `args.timeoutMs?` | `number` |

## Returns

[`RequestTimeout`](/api/@graphorin/provider/interfaces/RequestTimeout.md)
