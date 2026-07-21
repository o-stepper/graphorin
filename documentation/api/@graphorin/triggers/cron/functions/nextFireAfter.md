[**Graphorin API reference v0.13.11**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/triggers](/api/@graphorin/triggers/index.md) / [cron](/api/@graphorin/triggers/cron/index.md) / nextFireAfter

# Function: nextFireAfter()

```ts
function nextFireAfter(
   parsed, 
   from, 
   timeZone?): Date | null;
```

Defined in: packages/triggers/src/cron.ts:193

**`Stable`**

Compute the next fire time strictly after `from` for the supplied
cron schedule. Returns a UTC `Date`.

Without `timeZone` the expression is evaluated in **UTC** (the
historical default). With an IANA `timeZone` the fields match the
wall clock of that zone; DST transitions follow Vixie cron
semantics (see the module doc).

Returns `null` if no fire happens in the next 4 years (defensive -
impossible for a well-formed cron expression except a vacuous
combination that never aligns).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `parsed` | [`ParsedCron`](/api/@graphorin/triggers/cron/interfaces/ParsedCron.md) |
| `from` | `Date` |
| `timeZone?` | `string` |

## Returns

`Date` \| `null`
