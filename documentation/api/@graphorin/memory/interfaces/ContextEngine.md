[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ContextEngine

# Interface: ContextEngine

Defined in: packages/memory/src/context-engine/engine.ts:245

Public surface of the [ContextEngine](/api/@graphorin/memory/interfaces/ContextEngine.md) instance returned by
[createContextEngine](/api/@graphorin/memory/functions/createContextEngine.md).

## Stable

## Methods

### assemble()

```ts
assemble(memory, input): Promise<AssembledPrompt>;
```

Defined in: packages/memory/src/context-engine/engine.ts:247

Assemble the layered system prompt for a single step.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `memory` | [`Memory`](/api/@graphorin/memory/facade/interfaces/Memory.md) |
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

Defined in: packages/memory/src/context-engine/engine.ts:267

Run a compaction call. Phase 12 calls this when the trigger
fires (`source: 'auto-trigger'`) or the operator invokes
`agent.compact(...)` (`source: 'manual'`).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | \{ `agentId`: `string`; `memory`: [`Memory`](/api/@graphorin/memory/facade/interfaces/Memory.md); `messages`: readonly [`Message`](/api/@graphorin/core/type-aliases/Message.md)[]; `runId`: `string`; `scope`: [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md); `sessionId`: `string`; `signal?`: `AbortSignal`; `source`: [`CompactionSource`](/api/@graphorin/memory/type-aliases/CompactionSource.md); `summarizer?`: [`CompactionSummarizer`](/api/@graphorin/memory/interfaces/CompactionSummarizer.md); \} |
| `input.agentId` | `string` |
| `input.memory` | [`Memory`](/api/@graphorin/memory/facade/interfaces/Memory.md) |
| `input.messages` | readonly [`Message`](/api/@graphorin/core/type-aliases/Message.md)[] |
| `input.runId` | `string` |
| `input.scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `input.sessionId` | `string` |
| `input.signal?` | `AbortSignal` |
| `input.source` | [`CompactionSource`](/api/@graphorin/memory/type-aliases/CompactionSource.md) |
| `input.summarizer?` | [`CompactionSummarizer`](/api/@graphorin/memory/interfaces/CompactionSummarizer.md) |

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

Defined in: packages/memory/src/context-engine/engine.ts:283

Resolved configuration snapshot.

#### Returns

[`ResolvedContextEngineConfig`](/api/@graphorin/memory/interfaces/ResolvedContextEngineConfig.md)

***

### shouldCompact()

```ts
shouldCompact(messages, options?): Promise<boolean>;
```

Defined in: packages/memory/src/context-engine/engine.ts:258

Trigger evaluation primitive used by Phase 12 (agent runtime)
at the top of every step. Returns `true` when the in-flight
buffer's token count crosses the per-provider trigger
threshold. Pass `precomputedTokens` to amortize the count
via the per-message cache surfaced by
`SessionMemoryStoreExt.totalCachedTokens(scope)` (DEC-131) —
the production hot path is an O(1) comparison when the cache
is warm.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `messages` | readonly [`Message`](/api/@graphorin/core/type-aliases/Message.md)[] |
| `options?` | \{ `precomputedTokens?`: `number`; \} |
| `options.precomputedTokens?` | `number` |

#### Returns

`Promise`\&lt;`boolean`\&gt;
