[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / TracesStatusResult

# Interface: TracesStatusResult

Defined in: [packages/cli/src/commands/traces.ts:43](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/traces.ts#L43)

Field names predate the spans retarget (they said `StartedAt` when the
command aimed at the phantom `traces` table) and are kept for JSON
output stability; values now come from `spans.start_unix_nano`.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-neweststartedat"></a> `newestStartedAt?` | `readonly` | `string` | [packages/cli/src/commands/traces.ts:47](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/traces.ts#L47) |
| <a id="property-oldeststartedat"></a> `oldestStartedAt?` | `readonly` | `string` | [packages/cli/src/commands/traces.ts:46](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/traces.ts#L46) |
| <a id="property-rows"></a> `rows` | `readonly` | `number` | [packages/cli/src/commands/traces.ts:45](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/traces.ts#L45) |
| <a id="property-tableexists"></a> `tableExists` | `readonly` | `boolean` | [packages/cli/src/commands/traces.ts:44](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/traces.ts#L44) |
