[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / SandboxPolicy

# Type Alias: SandboxPolicy

```ts
type SandboxPolicy = "none" | "sandboxed" | "isolated" | "docker";
```

Defined in: [packages/core/src/types/tool.ts:12](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/tool.ts#L12)

Sandbox isolation level requested for a tool's `execute` method.

The exact semantics live in `@graphorin/security`; downstream packages
type their config field as `SandboxPolicy` so they don't take a security
dependency just to type their inputs.

## Stable
