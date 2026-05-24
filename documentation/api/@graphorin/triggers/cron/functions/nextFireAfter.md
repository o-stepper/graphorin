[**Graphorin API reference v0.3.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/triggers](/api/@graphorin/triggers/index.md) / [cron](/api/@graphorin/triggers/cron/index.md) / nextFireAfter

# Function: nextFireAfter()

```ts
function nextFireAfter(parsed, from): Date | null;
```

Defined in: packages/triggers/src/cron.ts:179

Compute the next fire time strictly after `from` for the supplied
cron schedule. Returns a UTC `Date` (the scheduler treats every
trigger as UTC; operators that need local time express that in
their cron expression).

Returns `null` if no fire happens in the next 4 years (defensive —
impossible for a well-formed cron expression except a vacuous
combination that never aligns).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `parsed` | [`ParsedCron`](/api/@graphorin/triggers/cron/interfaces/ParsedCron.md) |
| `from` | `Date` |

## Returns

`Date` \| `null`

## Stable
