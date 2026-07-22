[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / ConsolidatorDlqEntry

# Interface: ConsolidatorDlqEntry

Defined in: packages/cli/src/commands/consolidator.ts:205

**`Stable`**

One dead-letter batch as surfaced by `consolidator dlq list`.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-errorkind"></a> `errorKind` | `readonly` | `string` \| `null` | - | packages/cli/src/commands/consolidator.ts:209 |
| <a id="property-exhausted"></a> `exhausted` | `readonly` | `boolean` | `true` when retries are exhausted (`next_retry_at IS NULL`). | packages/cli/src/commands/consolidator.ts:213 |
| <a id="property-failedat"></a> `failedAt` | `readonly` | `string` | - | packages/cli/src/commands/consolidator.ts:211 |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | packages/cli/src/commands/consolidator.ts:206 |
| <a id="property-phase"></a> `phase` | `readonly` | `string` \| `null` | - | packages/cli/src/commands/consolidator.ts:208 |
| <a id="property-retrycount"></a> `retryCount` | `readonly` | `number` | - | packages/cli/src/commands/consolidator.ts:210 |
| <a id="property-userid"></a> `userId` | `readonly` | `string` \| `null` | - | packages/cli/src/commands/consolidator.ts:207 |
