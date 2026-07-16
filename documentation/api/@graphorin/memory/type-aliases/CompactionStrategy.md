[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / CompactionStrategy

# Type Alias: CompactionStrategy

```ts
type CompactionStrategy = 
  | {
  kind: "summarize-old-preserve-recent";
  preserveRecentTurns?: number;
  preserveUserMessages?: number;
  preStep?: boolean;
  summarizerInputCharBudget?: number;
  summarizerModel?: ModelSpec | string;
  summarizerTimeoutMs?: number;
  templateName?: string;
}
  | {
  clearAtLeast?: number;
  clearToolInputs?: boolean;
  excludeTools?: ReadonlyArray<string>;
  externalize?: (content, info) => Promise<{
     handleId: string;
     preview?: string;
  }>;
  keepToolUses?: number;
  kind: "clear-old-tool-results";
  readResultToolName?: string | null;
  summarizeFallback?:   | false
     | {
     preserveRecentTurns?: number;
     summarizerModel?: ModelSpec | string;
     summarizerTimeoutMs?: number;
     templateName?: string;
   };
}
  | {
  compact: (ctx) => Promise<CompactionResult>;
  kind: "custom";
};
```

Defined in: [packages/memory/src/context-engine/compaction/types.ts:101](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/types.ts#L101)

Strategy discriminator. The default
`'summarize-old-preserve-recent'` strategy invokes the
configured summarizer and replaces the older portion with a
structured section summary; `'clear-old-tool-results'` (SOTA-1) is
a zero-LLM tier that replaces the oldest tool results with compact
placeholders BEFORE any summarizer call, falling back to summarize
only if clearing did not reclaim enough; the `'custom'` variant
accepts an arbitrary callable.

## Union Members

### Type Literal

```ts
{
  kind: "summarize-old-preserve-recent";
  preserveRecentTurns?: number;
  preserveUserMessages?: number;
  preStep?: boolean;
  summarizerInputCharBudget?: number;
  summarizerModel?: ModelSpec | string;
  summarizerTimeoutMs?: number;
  templateName?: string;
}
```

| Name | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| `kind` | `"summarize-old-preserve-recent"` | - | [packages/memory/src/context-engine/compaction/types.ts:103](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/types.ts#L103) |
| `preserveRecentTurns?` | `number` | - | [packages/memory/src/context-engine/compaction/types.ts:104](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/types.ts#L104) |
| `preserveUserMessages?` | `number` | C4: keep the most recent N USER messages from the summarized window verbatim (re-inserted between the summary and the preserved tail) - only assistant/tool content is summarized away. User words are the task statement; paraphrase loses constraints. Default `2`; `0` disables. | [packages/memory/src/context-engine/compaction/types.ts:128](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/types.ts#L128) |
| `preStep?` | `boolean` | - | [packages/memory/src/context-engine/compaction/types.ts:108](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/types.ts#L108) |
| `summarizerInputCharBudget?` | `number` | Character budget for the older-messages dump embedded in the summarizer prompt (context-engine-07). Without a cap the single-shot prompt carries the ENTIRE older window (~85% of the main model's window at default thresholds) and overflows any smaller `summarizerModel` - the failure is swallowed, so the run silently never compacts. When the dump exceeds the budget the OLDEST messages are elided (a marker notes how many) and the newest are kept verbatim. Default 96_000 chars (~24k tokens); lower it for small summarizer models; `0` disables. | [packages/memory/src/context-engine/compaction/types.ts:120](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/types.ts#L120) |
| `summarizerModel?` | [`ModelSpec`](/api/@graphorin/core/type-aliases/ModelSpec.md) \| `string` | - | [packages/memory/src/context-engine/compaction/types.ts:105](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/types.ts#L105) |
| `summarizerTimeoutMs?` | `number` | - | [packages/memory/src/context-engine/compaction/types.ts:106](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/types.ts#L106) |
| `templateName?` | `string` | - | [packages/memory/src/context-engine/compaction/types.ts:107](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/types.ts#L107) |

***

### Type Literal

```ts
{
  clearAtLeast?: number;
  clearToolInputs?: boolean;
  excludeTools?: ReadonlyArray<string>;
  externalize?: (content, info) => Promise<{
     handleId: string;
     preview?: string;
  }>;
  keepToolUses?: number;
  kind: "clear-old-tool-results";
  readResultToolName?: string | null;
  summarizeFallback?:   | false
     | {
     preserveRecentTurns?: number;
     summarizerModel?: ModelSpec | string;
     summarizerTimeoutMs?: number;
     templateName?: string;
   };
}
```

| Name | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| `clearAtLeast?` | `number` | Only clear if at least this many tokens are reclaimable (default 0). | [packages/memory/src/context-engine/compaction/types.ts:139](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/types.ts#L139) |
| `clearToolInputs?` | `boolean` | C4 (clear_tool_uses_20250919 parity): additionally blank the PAIRED assistant tool-call arguments when a result is cleared, reclaiming the input side of verbose calls too. Default `false`. | [packages/memory/src/context-engine/compaction/types.ts:147](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/types.ts#L147) |
| `excludeTools?` | `ReadonlyArray`\&lt;`string`\&gt; | Tool names whose results are never cleared. | [packages/memory/src/context-engine/compaction/types.ts:141](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/types.ts#L141) |
| `externalize()?` | (`content`, `info`) => `Promise`\&lt;\{ `handleId`: `string`; `preview?`: `string`; \}\&gt; | A6 / SOTA-2 - recoverable clearing. Wire to a spill / `read_result` registry: cleared content is saved behind a handle and the placeholder references it so the model can re-fetch via `read_result`. Omitted ⇒ bare placeholders (irrecoverable). Only fires for clears that commit. | [packages/memory/src/context-engine/compaction/types.ts:161](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/types.ts#L161) |
| `keepToolUses?` | `number` | Most-recent tool results kept verbatim (default 3). | [packages/memory/src/context-engine/compaction/types.ts:137](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/types.ts#L137) |
| `kind` | `"clear-old-tool-results"` | SOTA-1 zero-LLM clearing tier (Anthropic `clear_tool_uses`): replace the oldest tool results with placeholders before paying for a summarizer. | [packages/memory/src/context-engine/compaction/types.ts:135](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/types.ts#L135) |
| `readResultToolName?` | `string` \| `null` | C4 (context-engine-11): the retrieval tool the externalized-handle placeholder advertises. Pass `null` when the runtime does not register `read_result` so the placeholder never promises a tool the model cannot call. Default `'read_result'`. | [packages/memory/src/context-engine/compaction/types.ts:154](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/types.ts#L154) |
| `summarizeFallback?` | \| `false` \| \{ `preserveRecentTurns?`: `number`; `summarizerModel?`: [`ModelSpec`](/api/@graphorin/core/type-aliases/ModelSpec.md) \| `string`; `summarizerTimeoutMs?`: `number`; `templateName?`: `string`; \} | What to do when clearing leaves the buffer over the threshold. Defaults to summarizing the already-cleared buffer (so the LLM sees the reduced window); set `false` for a pure zero-LLM tier that stops after clearing. | [packages/memory/src/context-engine/compaction/types.ts:174](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/types.ts#L174) |

***

### Type Literal

```ts
{
  compact: (ctx) => Promise<CompactionResult>;
  kind: "custom";
}
```

## Stable
