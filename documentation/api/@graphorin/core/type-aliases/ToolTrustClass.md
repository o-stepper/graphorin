[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ToolTrustClass

# Type Alias: ToolTrustClass

```ts
type ToolTrustClass = 
  | "first-party-built-in"
  | "first-party-user-defined"
  | "skill-trusted"
  | "skill-untrusted"
  | "mcp-derived"
  | "web-search"
  | "channel-inbound";
```

Defined in: packages/core/src/types/tool.ts:111

**`Stable`**

Trust class assigned to a registered tool. The class is computed at
registration time from the registration source and the declared
sandbox policy; downstream layers (sanitization, audit) read the
class to pick the right default policy.
