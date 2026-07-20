[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / defaultInboundSanitization

# Function: defaultInboundSanitization()

```ts
function defaultInboundSanitization(trustClass): InboundSanitizationPolicy;
```

Defined in: packages/tools/src/builder/trust-class.ts:66

**`Stable`**

Default inbound-sanitization policy per trust class. Operator
overrides via `tool({ inboundSanitization: ... })` always win.

- `'first-party-built-in'`     → `'pass-through'` (zero overhead).
- `'first-party-user-defined'` → `'detect-and-flag'` (no body
  modification, but operator visibility is preserved).
- `'skill-trusted'`            → `'detect-and-flag'`.
- `'skill-untrusted'`          → `'detect-and-strip-and-wrap'`.
- `'mcp-derived'`              → `'detect-and-strip-and-wrap'`.
- `'web-search'`               → `'detect-and-strip-and-wrap'`.
- `'channel-inbound'`          → `'detect-and-strip-and-wrap'`
  (message-borne channel text; no tool ever registers with this
  class, but the gateway reuses the same policy table).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `trustClass` | [`ToolTrustClass`](/api/@graphorin/core/type-aliases/ToolTrustClass.md) |

## Returns

[`InboundSanitizationPolicy`](/api/@graphorin/core/type-aliases/InboundSanitizationPolicy.md)
