[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / ReadResultToolOptions

# Interface: ReadResultToolOptions

Defined in: packages/tools/src/built-in/read-result.ts:25

Configuration for [createReadResultTool](/api/@graphorin/tools/functions/createReadResultTool.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-allowcrossrun"></a> `allowCrossRun?` | `readonly` | `boolean` | Allow reading spill handles that belong to ANOTHER run. Default `false`: spill artifacts live for days under the TTL sweep (confidential bodies included), and a model steered by injection could otherwise page through other runs' results. Opt in only for deliberate cross-run flows (e.g. a parent folding a sub-agent's handle, whose child run has its own runId). | packages/tools/src/built-in/read-result.ts:37 |
| <a id="property-defaultmaxbytes"></a> `defaultMaxBytes?` | `readonly` | `number` | Default `maxBytes` when the model does not pass one. Default `65536`. | packages/tools/src/built-in/read-result.ts:28 |
| <a id="property-reader"></a> `reader` | `readonly` | [`ResultReader`](/api/@graphorin/tools/interfaces/ResultReader.md) | - | packages/tools/src/built-in/read-result.ts:26 |
