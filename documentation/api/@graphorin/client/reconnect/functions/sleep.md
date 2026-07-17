[**Graphorin API reference v0.10.2**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/client](/api/@graphorin/client/index.md) / [reconnect](/api/@graphorin/client/reconnect/index.md) / sleep

# Function: sleep()

```ts
function sleep(durationMs, signal?): Promise<void>;
```

Defined in: [packages/client/src/reconnect.ts:67](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/reconnect.ts#L67)

Resolve when the requested number of milliseconds elapsed, or
reject (with a `DOMException`-style abort error) when the
supplied `AbortSignal` fires first.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `durationMs` | `number` |
| `signal?` | `AbortSignal` |

## Returns

`Promise`\&lt;`void`\&gt;

## Stable
