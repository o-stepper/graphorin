[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ReviserPresetOptions

# Interface: ReviserPresetOptions

Defined in: packages/memory/src/consolidator/presets.ts:21

Options accepted by [reviserConsolidatorPreset](/api/@graphorin/memory/functions/reviserConsolidatorPreset.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-ceilings"></a> `ceilings?` | `readonly` | `Partial`\&lt;[`ConsolidatorCeilings`](/api/@graphorin/memory/interfaces/ConsolidatorCeilings.md)\&gt; | Ceiling overrides on top of the `standard` tier defaults. | packages/memory/src/consolidator/presets.ts:47 |
| <a id="property-curatedblocks"></a> `curatedBlocks?` | `readonly` | readonly [`CuratedBlockSpec`](/api/@graphorin/memory/interfaces/CuratedBlockSpec.md)[] | Curated blocks the reviser maintains. Default: `[{ label: 'learned_context' }]`. | packages/memory/src/consolidator/presets.ts:30 |
| <a id="property-defaultscope"></a> `defaultScope` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | Scope the scheduled triggers fire under. | packages/memory/src/consolidator/presets.ts:25 |
| <a id="property-onexceed"></a> `onExceed?` | `readonly` | `"pause"` \| `"throw"` | Budget posture. The preset refuses `'log'` (an unattended reviser must stop, not narrate). Default `'pause'`. | packages/memory/src/consolidator/presets.ts:45 |
| <a id="property-provider"></a> `provider` | `readonly` | [`Provider`](/api/@graphorin/core/interfaces/Provider.md) | The (cheap) provider the reviser's passes run on. | packages/memory/src/consolidator/presets.ts:23 |
| <a id="property-reflection"></a> `reflection?` | `readonly` | `boolean` | Enable the deep-phase reflection pass too. Default `false`. | packages/memory/src/consolidator/presets.ts:49 |
| <a id="property-schedule"></a> `schedule?` | `readonly` | \{ `cron?`: [`ConsolidatorTriggerSpec`](/api/@graphorin/memory/type-aliases/ConsolidatorTriggerSpec.md); `idle?`: [`ConsolidatorTriggerSpec`](/api/@graphorin/memory/type-aliases/ConsolidatorTriggerSpec.md); \} | Cadence: the idle spec drives light+standard consolidation between sessions; the cron spec is what reaches the DEEP phase (curated blocks, reflection, conflict drain). Defaults: `idle: 'idle:15m'`, `cron: 'cron:0 5 * * *'`. | packages/memory/src/consolidator/presets.ts:37 |
| `schedule.cron?` | `readonly` | [`ConsolidatorTriggerSpec`](/api/@graphorin/memory/type-aliases/ConsolidatorTriggerSpec.md) | - | packages/memory/src/consolidator/presets.ts:39 |
| `schedule.idle?` | `readonly` | [`ConsolidatorTriggerSpec`](/api/@graphorin/memory/type-aliases/ConsolidatorTriggerSpec.md) | - | packages/memory/src/consolidator/presets.ts:38 |
