[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ContextEngine

# Interface: ContextEngine

Defined in: [packages/memory/src/memory-interface.ts:56](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/memory-interface.ts#L56)

Public surface of the [ContextEngine](/api/@graphorin/memory/interfaces/ContextEngine.md) instance returned by
[createContextEngine](/api/@graphorin/memory/functions/createContextEngine.md).

## Stable

## Methods

### assemble()

```ts
assemble(memory, input): Promise<AssembledPrompt>;
```

Defined in: [packages/memory/src/memory-interface.ts:58](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/memory-interface.ts#L58)

Assemble the layered system prompt for a single step.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `memory` | [`Memory`](/api/@graphorin/memory/interfaces/Memory.md) |
| `input` | [`AssembleInput`](/api/@graphorin/memory/interfaces/AssembleInput.md) |

#### Returns

`Promise`\&lt;[`AssembledPrompt`](/api/@graphorin/memory/interfaces/AssembledPrompt.md)\&gt;

***

### compactNow()

```ts
compactNow(input): Promise<{
  extraContent: readonly MessageContent[];
  hookFailures: readonly {
     hookName: string;
     reason: string;
  }[];
  result: CompactionResult;
}>;
```

Defined in: [packages/memory/src/memory-interface.ts:89](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/memory-interface.ts#L89)

Run a compaction call. Phase 12 calls this when the trigger
fires (`source: 'auto-trigger'`) or the operator invokes
`agent.compact(...)` (`source: 'manual'`).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `input` | \{ `agentId`: `string`; `memory`: [`Memory`](/api/@graphorin/memory/interfaces/Memory.md); `messages`: readonly [`Message`](/api/@graphorin/core/type-aliases/Message.md)[]; `prefixMessages?`: readonly [`Message`](/api/@graphorin/core/type-aliases/Message.md)[]; `preserveRecentTurns?`: `number`; `procedural?`: \{ `tags?`: readonly `string`[]; `topic?`: `string`; \}; `runId`: `string`; `scope`: [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md); `sessionId`: `string`; `signal?`: `AbortSignal`; `source`: [`CompactionSource`](/api/@graphorin/memory/type-aliases/CompactionSource.md); `summarizer?`: [`CompactionSummarizer`](/api/@graphorin/memory/interfaces/CompactionSummarizer.md); \} | - |
| `input.agentId` | `string` | - |
| `input.memory` | [`Memory`](/api/@graphorin/memory/interfaces/Memory.md) | - |
| `input.messages` | readonly [`Message`](/api/@graphorin/core/type-aliases/Message.md)[] | - |
| `input.prefixMessages?` | readonly [`Message`](/api/@graphorin/core/type-aliases/Message.md)[] | The caller's pinned system prefix - the messages EXCLUDED from `messages` before this call (context-engine-04). Used only for accounting: the anti-thrash guard and the "still above threshold" warning must compare against the FULL post-splice context (prefix + summary + preserved + essentials), or a real system prompt defeats the guard and a summarizer call fires every step at the context edge. Never compacted, never returned. |
| `input.preserveRecentTurns?` | `number` | Per-call override of the strategy's preserve-recent count (CE-3). |
| `input.procedural?` | \{ `tags?`: readonly `string`[]; `topic?`: `string`; \} | Topic/tags narrowing for the procedural-rules re-anchor hook (CE-6). |
| `input.procedural.tags?` | readonly `string`[] | - |
| `input.procedural.topic?` | `string` | - |
| `input.runId` | `string` | - |
| `input.scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | - |
| `input.sessionId` | `string` | - |
| `input.signal?` | `AbortSignal` | - |
| `input.source` | [`CompactionSource`](/api/@graphorin/memory/type-aliases/CompactionSource.md) | - |
| `input.summarizer?` | [`CompactionSummarizer`](/api/@graphorin/memory/interfaces/CompactionSummarizer.md) | - |

#### Returns

`Promise`\<\{
  `extraContent`: readonly [`MessageContent`](/api/@graphorin/core/type-aliases/MessageContent.md)[];
  `hookFailures`: readonly \{
     `hookName`: `string`;
     `reason`: `string`;
  \}[];
  `result`: [`CompactionResult`](/api/@graphorin/memory/interfaces/CompactionResult.md);
\}\>

***

### config()

```ts
config(): ResolvedContextEngineConfig;
```

Defined in: [packages/memory/src/memory-interface.ts:119](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/memory-interface.ts#L119)

Resolved configuration snapshot.

#### Returns

[`ResolvedContextEngineConfig`](/api/@graphorin/memory/interfaces/ResolvedContextEngineConfig.md)

***

### shouldCompact()

```ts
shouldCompact(messages, options?): Promise<boolean>;
```

Defined in: [packages/memory/src/memory-interface.ts:69](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/memory-interface.ts#L69)

Trigger evaluation primitive used by Phase 12 (agent runtime)
at the top of every step. Returns `true` when the in-flight
buffer's token count crosses the per-provider trigger
threshold. Pass `precomputedTokens` to amortize the count
via the per-message cache surfaced by
`SessionMemoryStoreExt.totalCachedTokens(scope)` (DEC-131) -
the production hot path is an O(1) comparison when the cache
is warm.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `messages` | readonly [`Message`](/api/@graphorin/core/type-aliases/Message.md)[] | - |
| `options?` | \{ `compactableFromIndex?`: `number`; `precomputedTokens?`: `number`; \} | - |
| `options.compactableFromIndex?` | `number` | Index of the first COMPACTABLE message (context-engine-04): the caller's pinned, never-compacted system prefix ends here. The SOTA-4 reclaim floor counts only `messages.slice(from)` older turns as reclaimable - without it a large system prompt is counted as reclaimable and the floor fires the summarizer for near-zero real reclaim. Default `0` (everything compactable). |
| `options.precomputedTokens?` | `number` | - |

#### Returns

`Promise`\&lt;`boolean`\&gt;
