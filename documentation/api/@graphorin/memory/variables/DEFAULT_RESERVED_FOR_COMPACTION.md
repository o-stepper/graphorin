[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / DEFAULT\_RESERVED\_FOR\_COMPACTION

# Variable: DEFAULT\_RESERVED\_FOR\_COMPACTION

```ts
const DEFAULT_RESERVED_FOR_COMPACTION: 8192 = 8192;
```

Defined in: packages/memory/src/context-engine/compaction/thresholds.ts:29

**`Stable`**

Reserved tokens for the compaction summarizer call so the
summarizer fits without re-triggering. Mirrors the suggested
DEC-162 default.
