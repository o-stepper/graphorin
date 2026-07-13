[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / Memory

# Interface: Memory

Defined in: [packages/memory/src/memory-interface.ts:127](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/memory-interface.ts#L127)

The facade returned by [createMemory](/api/@graphorin/memory/facade/functions/createMemory.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-conflictpipeline"></a> `conflictPipeline` | `readonly` | [`ConflictPipeline`](/api/@graphorin/memory/interfaces/ConflictPipeline.md) | The configured conflict pipeline. Surfaced for tests + CLI tooling. | [packages/memory/src/memory-interface.ts:143](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/memory-interface.ts#L143) |
| <a id="property-consolidator"></a> `consolidator` | `readonly` | [`Consolidator`](/api/@graphorin/memory/interfaces/Consolidator.md) | - | [packages/memory/src/memory-interface.ts:141](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/memory-interface.ts#L141) |
| <a id="property-contextengine"></a> `contextEngine` | `readonly` | [`ContextEngine`](/api/@graphorin/memory/interfaces/ContextEngine.md) | The configured context engine (Phase 10d). | [packages/memory/src/memory-interface.ts:145](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/memory-interface.ts#L145) |
| <a id="property-embedder"></a> `embedder` | `readonly` | \| [`EmbedderProvider`](/api/@graphorin/core/interfaces/EmbedderProvider.md) \| `null` | The active embedder, when configured. `null` otherwise. | [packages/memory/src/memory-interface.ts:147](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/memory-interface.ts#L147) |
| <a id="property-episodic"></a> `episodic` | `readonly` | [`EpisodicMemory`](/api/@graphorin/memory/classes/EpisodicMemory.md) | - | [packages/memory/src/memory-interface.ts:130](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/memory-interface.ts#L130) |
| <a id="property-ingestgate"></a> `ingestGate` | `readonly` | \| [`MemoryIngestGate`](/api/@graphorin/memory/type-aliases/MemoryIngestGate.md) \| `null` | The configured pre-extraction ingest gate (B3), or `null` when none is active. Surfaced as EVIDENCE for fail-closed config checks: enabling a proactive `act` grant or memory auto-promotion requires an active gate, and a self-asserted boolean would be no evidence at all. | [packages/memory/src/memory-interface.ts:155](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/memory-interface.ts#L155) |
| <a id="property-insights"></a> `insights` | `readonly` | [`InsightMemory`](/api/@graphorin/memory/classes/InsightMemory.md) | Read surface over reflection insights (P1-1). A no-op (returns empty) when the storage adapter does not expose the optional insight surface. | [packages/memory/src/memory-interface.ts:139](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/memory-interface.ts#L139) |
| <a id="property-procedural"></a> `procedural` | `readonly` | [`ProceduralMemory`](/api/@graphorin/memory/classes/ProceduralMemory.md) | - | [packages/memory/src/memory-interface.ts:132](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/memory-interface.ts#L132) |
| <a id="property-semantic"></a> `semantic` | `readonly` | [`SemanticMemory`](/api/@graphorin/memory/classes/SemanticMemory.md) | - | [packages/memory/src/memory-interface.ts:131](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/memory-interface.ts#L131) |
| <a id="property-session"></a> `session` | `readonly` | [`SessionMemory`](/api/@graphorin/memory/classes/SessionMemory.md) | - | [packages/memory/src/memory-interface.ts:129](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/memory-interface.ts#L129) |
| <a id="property-shared"></a> `shared` | `readonly` | [`SharedMemory`](/api/@graphorin/memory/classes/SharedMemory.md) | - | [packages/memory/src/memory-interface.ts:133](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/memory-interface.ts#L133) |
| <a id="property-tools"></a> `tools` | `readonly` | readonly [`Tool`](/api/@graphorin/core/interfaces/Tool.md)\&lt;`unknown`, `unknown`, `unknown`\&gt;[] | - | [packages/memory/src/memory-interface.ts:140](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/memory-interface.ts#L140) |
| <a id="property-working"></a> `working` | `readonly` | [`WorkingMemory`](/api/@graphorin/memory/classes/WorkingMemory.md) | - | [packages/memory/src/memory-interface.ts:128](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/memory-interface.ts#L128) |

## Methods

### compile()

```ts
compile(scope, options?): Promise<MemoryContextBlocks>;
```

Defined in: [packages/memory/src/memory-interface.ts:164](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/memory-interface.ts#L164)

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

Defined in: [packages/memory/src/memory-interface.ts:157](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/memory-interface.ts#L157)

The canonical id of the active embedder, when configured.

#### Returns

`string` \| `null`

***

### metadata()

```ts
metadata(scope): Promise<MemoryMetadata>;
```

Defined in: [packages/memory/src/memory-interface.ts:166](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/memory-interface.ts#L166)

Counter snapshot consumed by Phase 10d's metadata layer.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |

#### Returns

`Promise`\&lt;[`MemoryMetadata`](/api/@graphorin/core/interfaces/MemoryMetadata.md)\&gt;
