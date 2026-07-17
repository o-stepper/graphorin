[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/proactive](/api/@graphorin/proactive/index.md) / [](/api/@graphorin/proactive/README.md) / isWithinActiveHours

# Function: isWithinActiveHours()

```ts
function isWithinActiveHours(hours, now): boolean;
```

Defined in: [packages/proactive/src/active-hours.ts:51](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/active-hours.ts#L51)

`true` when `now` (epoch ms) falls inside the window's wall clock.
Pure and deterministic for a given clock value.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `hours` | [`ActiveHours`](/api/@graphorin/proactive/interfaces/ActiveHours.md) |
| `now` | `number` |

## Returns

`boolean`

## Stable
