[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / ConsolidatorDlqEntry

# Interface: ConsolidatorDlqEntry

Defined in: [packages/cli/src/commands/consolidator.ts:205](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/consolidator.ts#L205)

One dead-letter batch as surfaced by `consolidator dlq list`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-errorkind"></a> `errorKind` | `readonly` | `string` \| `null` | - | [packages/cli/src/commands/consolidator.ts:209](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/consolidator.ts#L209) |
| <a id="property-exhausted"></a> `exhausted` | `readonly` | `boolean` | `true` when retries are exhausted (`next_retry_at IS NULL`). | [packages/cli/src/commands/consolidator.ts:213](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/consolidator.ts#L213) |
| <a id="property-failedat"></a> `failedAt` | `readonly` | `string` | - | [packages/cli/src/commands/consolidator.ts:211](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/consolidator.ts#L211) |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | [packages/cli/src/commands/consolidator.ts:206](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/consolidator.ts#L206) |
| <a id="property-phase"></a> `phase` | `readonly` | `string` \| `null` | - | [packages/cli/src/commands/consolidator.ts:208](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/consolidator.ts#L208) |
| <a id="property-retrycount"></a> `retryCount` | `readonly` | `number` | - | [packages/cli/src/commands/consolidator.ts:210](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/consolidator.ts#L210) |
| <a id="property-userid"></a> `userId` | `readonly` | `string` \| `null` | - | [packages/cli/src/commands/consolidator.ts:207](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/consolidator.ts#L207) |
