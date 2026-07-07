[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / ContentOriginKind

# Type Alias: ContentOriginKind

```ts
type ContentOriginKind = 
  | "built-in"
  | "user-defined"
  | "trusted-skill"
  | "untrusted-skill"
  | "mcp"
  | "web-search";
```

Defined in: [packages/agent/src/lateral-leak/merge-guard.ts:33](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/lateral-leak/merge-guard.ts#L33)

Tool-source provenance multiplier. Mirrors the `ContentOrigin`
annotation from `@graphorin/memory.context-engine`.

## Stable
