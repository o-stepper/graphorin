[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConflictThresholds

# Interface: ConflictThresholds

Defined in: [packages/memory/src/conflict/types.ts:35](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/conflict/types.ts#L35)

Configurable similarity thresholds for Stage 2 (embedding three-
zone). Defaults pinned at `0.95 / 0.85 / 0.4` per RB-02 §8 - the
production values for the default `Xenova/multilingual-e5-base`
embedder (DEC-130).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-cold"></a> `cold` | `readonly` | `number` | [packages/memory/src/conflict/types.ts:38](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/conflict/types.ts#L38) |
| <a id="property-hot"></a> `hot` | `readonly` | `number` | [packages/memory/src/conflict/types.ts:36](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/conflict/types.ts#L36) |
| <a id="property-neardup"></a> `nearDup` | `readonly` | `number` | [packages/memory/src/conflict/types.ts:37](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/conflict/types.ts#L37) |
