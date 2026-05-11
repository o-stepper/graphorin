[**Graphorin API reference v0.1.0**](../../../index.md)

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
  compact: (ctx) => Promise<CompactionResult>;
  kind: "custom";
};
```

Defined in: packages/memory/src/context-engine/compaction/types.ts:79

Strategy discriminator. The default
`'summarize-old-preserve-recent'` strategy invokes the
configured summarizer and replaces the older portion with a
structured 9-section summary; the `'custom'` variant accepts an
arbitrary callable.

## Stable
