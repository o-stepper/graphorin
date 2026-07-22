[**Graphorin API reference v0.14.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/triggers](/api/@graphorin/triggers/index.md) / [cron](/api/@graphorin/triggers/cron/index.md) / parseCron

# Function: parseCron()

```ts
function parseCron(expression): ParsedCron;
```

Defined in: packages/triggers/src/cron.ts:90

**`Stable`**

Parse a 5-field cron expression. Throws [CronParseError](/api/@graphorin/triggers/cron/classes/CronParseError.md) on
any malformed input.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `expression` | `string` |

## Returns

[`ParsedCron`](/api/@graphorin/triggers/cron/interfaces/ParsedCron.md)
