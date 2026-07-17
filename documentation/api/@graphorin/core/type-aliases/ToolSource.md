[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ToolSource

# Type Alias: ToolSource

```ts
type ToolSource = 
  | {
  kind: "first-party";
}
  | {
  kind: "built-in";
  subsystem: string;
}
  | {
  kind: "skill";
  skillName: string;
  trustLevel: "trusted" | "untrusted";
}
  | {
  kind: "mcp";
  serverIdentity: string;
}
  | {
  kind: "web-search";
  providerName: string;
};
```

Defined in: [packages/core/src/types/tool.ts:127](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/tool.ts#L127)

Source descriptor attached to a `Tool` registration. Mirrors the
registration-time provenance the dispatcher uses to derive the
trust class and to compute the four collision audit row kinds.

## Stable
