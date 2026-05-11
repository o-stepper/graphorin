[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / applyInboundSanitization

# Function: applyInboundSanitization()

```ts
function applyInboundSanitization(opts): SanitizationOutcome;
```

Defined in: packages/tools/src/inbound/sanitize.ts:63

Apply the per-policy inbound sanitization.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `opts` | \{ `body`: `string`; `budgetMs?`: `number`; `contentOrigin?`: `string`; `failClosed?`: `boolean`; `patterns?`: readonly [`ImperativePattern`](/api/@graphorin/observability/redaction/imperative-patterns/interfaces/ImperativePattern.md)[]; `policy`: [`InboundSanitizationPolicy`](/api/@graphorin/core/type-aliases/InboundSanitizationPolicy.md); `toolName`: `string`; `trustClass`: [`ToolTrustClass`](/api/@graphorin/core/type-aliases/ToolTrustClass.md); \} | - |
| `opts.body` | `string` | - |
| `opts.budgetMs?` | `number` | Best-effort scan budget in milliseconds. Default `5`. |
| `opts.contentOrigin?` | `string` | - |
| `opts.failClosed?` | `boolean` | - |
| `opts.patterns?` | readonly [`ImperativePattern`](/api/@graphorin/observability/redaction/imperative-patterns/interfaces/ImperativePattern.md)[] | - |
| `opts.policy` | [`InboundSanitizationPolicy`](/api/@graphorin/core/type-aliases/InboundSanitizationPolicy.md) | - |
| `opts.toolName` | `string` | - |
| `opts.trustClass` | [`ToolTrustClass`](/api/@graphorin/core/type-aliases/ToolTrustClass.md) | - |

## Returns

[`SanitizationOutcome`](/api/@graphorin/tools/interfaces/SanitizationOutcome.md)

## Stable
