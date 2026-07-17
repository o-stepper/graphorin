[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / runDoctor

# Function: runDoctor()

```ts
function runDoctor(options?): Promise<DoctorReport>;
```

Defined in: [packages/cli/src/commands/doctor.ts:111](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/doctor.ts#L111)

Programmatic entry point. Returns the [DoctorReport](/api/@graphorin/cli/interfaces/DoctorReport.md) so tests
and downstream automations consume the structured payload directly.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`DoctorCommandOptions`](/api/@graphorin/cli/interfaces/DoctorCommandOptions.md) |

## Returns

`Promise`\&lt;[`DoctorReport`](/api/@graphorin/cli/interfaces/DoctorReport.md)\&gt;

## Stable
