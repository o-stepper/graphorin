[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ReviserConsolidatorConfig

# Interface: ReviserConsolidatorConfig

Defined in: [packages/memory/src/consolidator/presets.ts:58](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/presets.ts#L58)

The configuration object [reviserConsolidatorPreset](/api/@graphorin/memory/functions/reviserConsolidatorPreset.md) produces -
structurally assignable to `createMemory({ consolidator })`.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-ceilings"></a> `ceilings?` | `readonly` | `Partial`\&lt;[`ConsolidatorCeilings`](/api/@graphorin/memory/interfaces/ConsolidatorCeilings.md)\&gt; | [packages/memory/src/consolidator/presets.ts:68](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/presets.ts#L68) |
| <a id="property-curatedblocks"></a> `curatedBlocks` | `readonly` | readonly [`CuratedBlockSpec`](/api/@graphorin/memory/interfaces/CuratedBlockSpec.md)[] | [packages/memory/src/consolidator/presets.ts:67](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/presets.ts#L67) |
| <a id="property-deepprovider"></a> `deepProvider` | `readonly` | [`Provider`](/api/@graphorin/core/interfaces/Provider.md) | [packages/memory/src/consolidator/presets.ts:62](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/presets.ts#L62) |
| <a id="property-defaultscope"></a> `defaultScope` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | [packages/memory/src/consolidator/presets.ts:63](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/presets.ts#L63) |
| <a id="property-enabled"></a> `enabled` | `readonly` | `true` | [packages/memory/src/consolidator/presets.ts:59](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/presets.ts#L59) |
| <a id="property-onexceed"></a> `onExceed` | `readonly` | `"pause"` \| `"throw"` | [packages/memory/src/consolidator/presets.ts:65](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/presets.ts#L65) |
| <a id="property-provider"></a> `provider` | `readonly` | [`Provider`](/api/@graphorin/core/interfaces/Provider.md) | [packages/memory/src/consolidator/presets.ts:61](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/presets.ts#L61) |
| <a id="property-reflection"></a> `reflection` | `readonly` | `boolean` | [packages/memory/src/consolidator/presets.ts:66](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/presets.ts#L66) |
| <a id="property-tier"></a> `tier` | `readonly` | `"standard"` | [packages/memory/src/consolidator/presets.ts:60](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/presets.ts#L60) |
| <a id="property-triggers"></a> `triggers` | `readonly` | readonly [`ConsolidatorTriggerSpec`](/api/@graphorin/memory/type-aliases/ConsolidatorTriggerSpec.md)[] | [packages/memory/src/consolidator/presets.ts:64](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/presets.ts#L64) |
