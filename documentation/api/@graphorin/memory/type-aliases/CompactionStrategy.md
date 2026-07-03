[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / CompactionStrategy

# Type Alias: CompactionStrategy

```ts
type CompactionStrategy = 
  | {
  kind: "summarize-old-preserve-recent";
  preserveRecentTurns?: number;
  preStep?: boolean;
  summarizerModel?: ModelSpec | string;
  summarizerTimeoutMs?: number;
  templateName?: string;
}
  | {
  clearAtLeast?: number;
  excludeTools?: ReadonlyArray<string>;
  externalize?: (content, info) => Promise<{
     handleId: string;
     preview?: string;
  }>;
  keepToolUses?: number;
  kind: "clear-old-tool-results";
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

Defined in: packages/memory/src/context-engine/compaction/types.ts:101

Strategy discriminator. The default
`'summarize-old-preserve-recent'` strategy invokes the
configured summarizer and replaces the older portion with a
structured 9-section summary; `'clear-old-tool-results'` (SOTA-1) is
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
  preStep?: boolean;
  summarizerModel?: ModelSpec | string;
  summarizerTimeoutMs?: number;
  templateName?: string;
}
```

***

### Type Literal

```ts
{
  clearAtLeast?: number;
  excludeTools?: ReadonlyArray<string>;
  externalize?: (content, info) => Promise<{
     handleId: string;
     preview?: string;
  }>;
  keepToolUses?: number;
  kind: "clear-old-tool-results";
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
| `clearAtLeast?` | `number` | Only clear if at least this many tokens are reclaimable (default 0). | packages/memory/src/context-engine/compaction/types.ts:119 |
| `excludeTools?` | `ReadonlyArray`\&lt;`string`\&gt; | Tool names whose results are never cleared. | packages/memory/src/context-engine/compaction/types.ts:121 |
| `externalize()?` | (`content`, `info`) => `Promise`\&lt;\{ `handleId`: `string`; `preview?`: `string`; \}\&gt; | A6 / SOTA-2 — recoverable clearing. Wire to a spill / `read_result` registry: cleared content is saved behind a handle and the placeholder references it so the model can re-fetch via `read_result`. Omitted ⇒ bare placeholders (irrecoverable). Only fires for clears that commit. | packages/memory/src/context-engine/compaction/types.ts:128 |
| `keepToolUses?` | `number` | Most-recent tool results kept verbatim (default 3). | packages/memory/src/context-engine/compaction/types.ts:117 |
| `kind` | `"clear-old-tool-results"` | SOTA-1 zero-LLM clearing tier (Anthropic `clear_tool_uses`): replace the oldest tool results with placeholders before paying for a summarizer. | packages/memory/src/context-engine/compaction/types.ts:115 |
| `summarizeFallback?` | \| `false` \| \{ `preserveRecentTurns?`: `number`; `summarizerModel?`: [`ModelSpec`](/api/@graphorin/core/type-aliases/ModelSpec.md) \| `string`; `summarizerTimeoutMs?`: `number`; `templateName?`: `string`; \} | What to do when clearing leaves the buffer over the threshold. Defaults to summarizing the already-cleared buffer (so the LLM sees the reduced window); set `false` for a pure zero-LLM tier that stops after clearing. | packages/memory/src/context-engine/compaction/types.ts:141 |

***

### Type Literal

```ts
{
  compact: (ctx) => Promise<CompactionResult>;
  kind: "custom";
}
```

## Stable
