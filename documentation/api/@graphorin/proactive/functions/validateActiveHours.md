[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/proactive](/api/@graphorin/proactive/index.md) / [](/api/@graphorin/proactive/README.md) / validateActiveHours

# Function: validateActiveHours()

```ts
function validateActiveHours(hours): void;
```

Defined in: packages/proactive/src/active-hours.ts:37

Validate an [ActiveHours](/api/@graphorin/proactive/interfaces/ActiveHours.md) declaration eagerly. Throws
`TypeError` on a malformed time or an unknown timezone - at
construction time, never at first fire.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `hours` | [`ActiveHours`](/api/@graphorin/proactive/interfaces/ActiveHours.md) |

## Returns

`void`
