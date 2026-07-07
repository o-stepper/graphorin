[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / createAsyncContext

# Function: createAsyncContext()

```ts
function createAsyncContext<T>(_name?): AsyncContext<T>;
```

Defined in: [packages/core/src/utils/async-context.ts:36](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/utils/async-context.ts#L36)

Construct a typed `AsyncContext`. The optional `name` is surfaced in
the diagnostics channel of `AsyncLocalStorage` (debugging only).

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `_name?` | `string` |

## Returns

[`AsyncContext`](/api/@graphorin/core/interfaces/AsyncContext.md)\&lt;`T`\&gt;

## Stable
