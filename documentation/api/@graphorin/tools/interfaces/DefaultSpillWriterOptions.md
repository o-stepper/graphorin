[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / DefaultSpillWriterOptions

# Interface: DefaultSpillWriterOptions

Defined in: packages/tools/src/result/spill.ts:19

Options for [createDefaultSpillWriter](/api/@graphorin/tools/functions/createDefaultSpillWriter.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-root"></a> `root?` | `readonly` | `string` | Artifact root. Default `<os.tmpdir()>/graphorin-spill`. | packages/tools/src/result/spill.ts:21 |
| <a id="property-startupsweepttlms"></a> `startupSweepTtlMs?` | `readonly` | `number` \| `false` | TTL for the best-effort startup sweep of orphaned run directories. Default 7 days; pass `false` to disable the startup sweep. | packages/tools/src/result/spill.ts:26 |
