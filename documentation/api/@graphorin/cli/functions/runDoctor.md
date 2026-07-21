[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / runDoctor

# Function: runDoctor()

```ts
function runDoctor(options?): Promise<DoctorReport>;
```

Defined in: packages/cli/src/commands/doctor.ts:144

**`Stable`**

Programmatic entry point. Returns the [DoctorReport](/api/@graphorin/cli/interfaces/DoctorReport.md) so tests
and downstream automations consume the structured payload directly.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`DoctorCommandOptions`](/api/@graphorin/cli/interfaces/DoctorCommandOptions.md) |

## Returns

`Promise`\&lt;[`DoctorReport`](/api/@graphorin/cli/interfaces/DoctorReport.md)\&gt;
