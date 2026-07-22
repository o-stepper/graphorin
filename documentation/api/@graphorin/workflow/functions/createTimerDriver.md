[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / createTimerDriver

# Function: createTimerDriver()

```ts
function createTimerDriver(options): TimerDriver;
```

Defined in: packages/workflow/src/timer-driver.ts:112

**`Stable`**

Build a polling driver over the supplied workflows. Call
`start()` to begin polling; the next pass is scheduled at
`min(pollIntervalMs, earliest nextWakeAt)` so a short timer does not
wait out a long poll interval.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`CreateTimerDriverOptions`](/api/@graphorin/workflow/interfaces/CreateTimerDriverOptions.md) |

## Returns

[`TimerDriver`](/api/@graphorin/workflow/interfaces/TimerDriver.md)
