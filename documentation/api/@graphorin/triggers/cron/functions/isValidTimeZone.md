[**Graphorin API reference v0.13.9**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/triggers](/api/@graphorin/triggers/index.md) / [cron](/api/@graphorin/triggers/cron/index.md) / isValidTimeZone

# Function: isValidTimeZone()

```ts
function isValidTimeZone(timeZone): boolean;
```

Defined in: packages/triggers/src/cron.ts:273

**`Stable`**

`true` when `timeZone` is an IANA zone name this runtime's Intl data
resolves. The `cron(...)` helper uses it for eager validation so a
typo fails at registration time, never at first fire.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `timeZone` | `string` |

## Returns

`boolean`
