[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / rollup

# Function: rollup()

```ts
function rollup(checks): HealthRollup;
```

Defined in: [packages/server/src/health/checks.ts:362](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L362)

Promote the worst per-check status to the rollup label.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `checks` | [`HealthChecks`](/api/@graphorin/server/interfaces/HealthChecks.md) |

## Returns

[`HealthRollup`](/api/@graphorin/server/type-aliases/HealthRollup.md)

## Stable
