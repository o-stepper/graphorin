[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / NormaliseToolOptions

# Interface: NormaliseToolOptions

Defined in: [packages/tools/src/registry/normalize.ts:102](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/registry/normalize.ts#L102)

Registry-level normalisation knobs threaded from
`createToolRegistry(...)` (C6).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-deferloadingbydefault"></a> `deferLoadingByDefault?` | `readonly` | `boolean` | Treat tools that do not declare `defer_loading` as deferred (the minimal-scaffold posture). An explicit `defer_loading: false` on the tool still wins - the per-tool declaration is the stronger signal. `built-in` source registrations are exempt: the runtime registers those deliberately (`tool_search`, `read_result`, ...) and deferring the discovery surface itself would be self-defeating. Default `false` (per-tool opt-in, the pre-C6 behaviour). | [packages/tools/src/registry/normalize.ts:112](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/registry/normalize.ts#L112) |
