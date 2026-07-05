[**Graphorin API reference v0.6.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [facade](/api/@graphorin/memory/facade/index.md) / Memory

# Interface: Memory

Defined in: packages/memory/src/facade.ts:302

The facade returned by [createMemory](/api/@graphorin/memory/facade/functions/createMemory.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-conflictpipeline"></a> `conflictPipeline` | `readonly` | [`ConflictPipeline`](/api/@graphorin/memory/interfaces/ConflictPipeline.md) | The configured conflict pipeline. Surfaced for tests + CLI tooling. | packages/memory/src/facade.ts:318 |
| <a id="property-consolidator"></a> `consolidator` | `readonly` | [`Consolidator`](/api/@graphorin/memory/interfaces/Consolidator.md) | - | packages/memory/src/facade.ts:316 |
| <a id="property-contextengine"></a> `contextEngine` | `readonly` | [`ContextEngine`](/api/@graphorin/memory/interfaces/ContextEngine.md) | The configured context engine (Phase 10d). | packages/memory/src/facade.ts:320 |
| <a id="property-embedder"></a> `embedder` | `readonly` | \| [`EmbedderProvider`](/api/@graphorin/core/interfaces/EmbedderProvider.md) \| `null` | The active embedder, when configured. `null` otherwise. | packages/memory/src/facade.ts:322 |
| <a id="property-episodic"></a> `episodic` | `readonly` | [`EpisodicMemory`](/api/@graphorin/memory/classes/EpisodicMemory.md) | - | packages/memory/src/facade.ts:305 |
| <a id="property-insights"></a> `insights` | `readonly` | [`InsightMemory`](/api/@graphorin/memory/classes/InsightMemory.md) | Read surface over reflection insights (P1-1). A no-op (returns empty) when the storage adapter does not expose the optional insight surface. | packages/memory/src/facade.ts:314 |
| <a id="property-procedural"></a> `procedural` | `readonly` | [`ProceduralMemory`](/api/@graphorin/memory/classes/ProceduralMemory.md) | - | packages/memory/src/facade.ts:307 |
| <a id="property-semantic"></a> `semantic` | `readonly` | [`SemanticMemory`](/api/@graphorin/memory/classes/SemanticMemory.md) | - | packages/memory/src/facade.ts:306 |
| <a id="property-session"></a> `session` | `readonly` | [`SessionMemory`](/api/@graphorin/memory/classes/SessionMemory.md) | - | packages/memory/src/facade.ts:304 |
| <a id="property-shared"></a> `shared` | `readonly` | [`SharedMemory`](/api/@graphorin/memory/classes/SharedMemory.md) | - | packages/memory/src/facade.ts:308 |
| <a id="property-tools"></a> `tools` | `readonly` | readonly [`Tool`](/api/@graphorin/core/interfaces/Tool.md)\&lt;`unknown`, `unknown`, `unknown`\&gt;[] | - | packages/memory/src/facade.ts:315 |
| <a id="property-working"></a> `working` | `readonly` | [`WorkingMemory`](/api/@graphorin/memory/classes/WorkingMemory.md) | - | packages/memory/src/facade.ts:303 |

## Methods

### compile()

```ts
compile(scope, options?): Promise<MemoryContextBlocks>;
```

Defined in: packages/memory/src/facade.ts:331

Compile a system-prompt block bundle. The bundle carries the
static fragments per memory tier; the agent runtime consumes
the [ContextEngine](/api/@graphorin/memory/interfaces/ContextEngine.md) surface (`memory.contextEngine`)
directly for the full six-layer assembly.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `options?` | [`CompileOptions`](/api/@graphorin/memory/interfaces/CompileOptions.md) |

#### Returns

`Promise`\&lt;[`MemoryContextBlocks`](/api/@graphorin/memory/interfaces/MemoryContextBlocks.md)\&gt;

***

### embedderId()

```ts
embedderId(): string | null;
```

Defined in: packages/memory/src/facade.ts:324

The canonical id of the active embedder, when configured.

#### Returns

`string` \| `null`

***

### metadata()

```ts
metadata(scope): Promise<MemoryMetadata>;
```

Defined in: packages/memory/src/facade.ts:333

Counter snapshot consumed by Phase 10d's metadata layer.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |

#### Returns

`Promise`\&lt;[`MemoryMetadata`](/api/@graphorin/core/interfaces/MemoryMetadata.md)\&gt;
