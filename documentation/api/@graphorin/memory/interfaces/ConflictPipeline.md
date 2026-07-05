[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConflictPipeline

# Interface: ConflictPipeline

Defined in: packages/memory/src/conflict/types.ts:179

Pre-built pipeline returned by [createConflictPipeline](/api/@graphorin/memory/functions/createConflictPipeline.md). The
`run` method is what `SemanticMemory.remember(...)` calls to make
the conflict decision.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-localepack"></a> `localePack` | `readonly` | [`LocalePack`](/api/@graphorin/memory/interfaces/LocalePack.md) | packages/memory/src/conflict/types.ts:181 |
| <a id="property-mode"></a> `mode` | `readonly` | `"on"` \| `"off"` | packages/memory/src/conflict/types.ts:180 |
| <a id="property-thresholds"></a> `thresholds` | `readonly` | [`ConflictThresholds`](/api/@graphorin/memory/interfaces/ConflictThresholds.md) | packages/memory/src/conflict/types.ts:182 |

## Methods

### run()

```ts
run(deps, candidate): Promise<ConflictDecision>;
```

Defined in: packages/memory/src/conflict/types.ts:183

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `deps` | [`ConflictPipelineDeps`](/api/@graphorin/memory/interfaces/ConflictPipelineDeps.md) |
| `candidate` | [`Fact`](/api/@graphorin/core/interfaces/Fact.md) |

#### Returns

`Promise`\&lt;[`ConflictDecision`](/api/@graphorin/memory/type-aliases/ConflictDecision.md)\&gt;
