[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / COMPACTION\_SUMMARY\_MARKER

# Variable: COMPACTION\_SUMMARY\_MARKER

```ts
const COMPACTION_SUMMARY_MARKER: "<graphorin_compaction_summary";
```

Defined in: packages/memory/src/context-engine/compaction/templates/marker.ts:33

**`Stable`**

Detection prefix - the opening tag WITHOUT the trailing `>` so a
`startsWith` scan also matches any future attribute-carrying variant.
