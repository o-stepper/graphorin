[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / AutoRecallTriggers

# Interface: AutoRecallTriggers

Defined in: packages/memory/src/context-engine/locale-packs/types.ts:22

**`Stable`**

Trigger mode used by the auto-recall heuristic. The framework ships
regex patterns for the bundled locale; consumers may extend or
replace them via [defineContextLocalePack](/api/@graphorin/memory/functions/defineContextLocalePack.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-facttriggers"></a> `factTriggers` | `readonly` | readonly `RegExp`[] | Case-insensitive regex set evaluated against the last user message. A match indicates the model would benefit from the top-K facts being injected into Layer 6. | packages/memory/src/context-engine/locale-packs/types.ts:28 |
