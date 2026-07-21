[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / MemoryGuardTier

# Type Alias: MemoryGuardTier

```ts
type MemoryGuardTier = 
  | "pure"
  | "side-effecting-no-memory"
  | "memory-aware"
  | "unknown"
  | "untrusted";
```

Defined in: packages/core/src/types/tool.ts:34

**`Stable`**

Memory-modification guard tier requested for a tool's `execute` method.

Mirrors the tier classification consumed by `@graphorin/security`'s
memory-modification guard so downstream packages can type their tool
metadata against this discriminator without a hard dependency on the
security package.

- `'pure'`                     - no side effects of any kind.
- `'side-effecting-no-memory'` - observable side effects outside of
  the framework's memory tiers (e.g. external HTTP).
- `'memory-aware'`             - mutates the framework's memory
  tiers via the sanctioned `ctx.memory.*` surface only.
- `'unknown'`                  - no declaration; the runtime applies
  the audit-only baseline.
- `'untrusted'`                - third-party / untrusted skill code;
  the runtime forces the strictest snapshot policy.
