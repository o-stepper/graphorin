[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / createConsoleRetentionLog

# Function: createConsoleRetentionLog()

```ts
function createConsoleRetentionLog(flavour): 
  | RetentionLog
  | undefined;
```

Defined in: [packages/server/src/runtime/retention.ts:130](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/retention.ts#L130)

Console-backed [RetentionLog](/api/@graphorin/server/type-aliases/RetentionLog.md) honouring the
`observability.logger` config flavour. Returns `undefined` for
`'silent'` so callers can pass the result straight through.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `flavour` | `"json"` \| `"pretty"` \| `"silent"` |

## Returns

  \| [`RetentionLog`](/api/@graphorin/server/type-aliases/RetentionLog.md)
  \| `undefined`

## Stable
