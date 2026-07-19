[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / NormaliseToolOptions

# Interface: NormaliseToolOptions

Defined in: packages/tools/src/registry/normalize.ts:102

**`Stable`**

Registry-level normalisation knobs threaded from
`createToolRegistry(...)`.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-deferloadingbydefault"></a> `deferLoadingByDefault?` | `readonly` | `boolean` | Treat tools that do not declare `defer_loading` as deferred (the minimal-scaffold posture). An explicit `defer_loading: false` on the tool still wins - the per-tool declaration is the stronger signal. `built-in` source registrations are exempt: the runtime registers those deliberately (`tool_search`, `read_result`, ...) and deferring the discovery surface itself would be self-defeating. Default `false` (per-tool opt-in). | packages/tools/src/registry/normalize.ts:112 |
