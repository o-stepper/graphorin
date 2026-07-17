[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / InboundTrust

# Type Alias: InboundTrust

```ts
type InboundTrust = 
  | "trusted"
  | "user-defined"
  | "untrusted-skill"
  | "mcp"
  | "web-search"
  | "n/a";
```

Defined in: [packages/memory/src/context-engine/annotations.ts:81](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/annotations.ts#L81)

Trust-class discriminator for an assembled message-content part.
Sibling axis to [ContentOrigin](/api/@graphorin/memory/type-aliases/ContentOrigin.md); the two are independent.

- `'trusted'` - built-in framework tools + trusted-skill-bundled
  tools; D4 preamble does NOT fire on steps containing only
  these parts.
- `'user-defined'` - tools registered via `tool({...})` from user
  application code; D4 preamble fires.
- `'untrusted-skill'` - tools bundled by an untrusted skill; D4
  preamble fires; default policy is strip-and-wrap.
- `'mcp'` - every `Tool` produced by `MCPClient.toTools(...)`; D4
  preamble fires; default policy is strip-and-wrap.
- `'web-search'` - built-in `web_search` adapter; D4 preamble
  fires; default policy is strip-and-wrap.
- `'n/a'` - non-tool-result parts for which the inbound-trust
  axis is meaningless (`'user:input'`, `'memory:tier-filtered'`,
  `'system:framework'`, `'agent:instructions'`,
  `'tool-call:args'`).

## Stable
