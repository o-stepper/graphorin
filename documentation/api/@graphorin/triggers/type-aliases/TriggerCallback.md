[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/triggers](/api/@graphorin/triggers/index.md) / [](/api/@graphorin/triggers/README.md) / TriggerCallback

# Type Alias: TriggerCallback

```ts
type TriggerCallback = (payload?) => void | Promise<void>;
```

Defined in: packages/triggers/src/index.ts:123

**`Stable`**

Trigger callback. Receives an optional `payload` for `event`
triggers; for cron / interval / idle triggers `payload` is
`undefined`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `payload?` | `unknown` |

## Returns

`void` \| `Promise`\&lt;`void`\&gt;
