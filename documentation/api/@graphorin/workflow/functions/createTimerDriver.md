[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / createTimerDriver

# Function: createTimerDriver()

```ts
function createTimerDriver(options): TimerDriver;
```

Defined in: packages/workflow/src/timer-driver.ts:112

Build a polling driver over the supplied workflows (W-032). Call
`start()` to begin polling; the next pass is scheduled at
`min(pollIntervalMs, earliest nextWakeAt)` so a short timer does not
wait out a long poll interval.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`CreateTimerDriverOptions`](/api/@graphorin/workflow/interfaces/CreateTimerDriverOptions.md) |

## Returns

[`TimerDriver`](/api/@graphorin/workflow/interfaces/TimerDriver.md)

## Stable
