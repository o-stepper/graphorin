[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / applyInboundSanitization

# Function: applyInboundSanitization()

```ts
function applyInboundSanitization(opts): SanitizationOutcome;
```

Defined in: packages/tools/src/inbound/sanitize.ts:87

Apply the per-policy inbound sanitization.

## Defense posture (why `failClosed` defaults to off)

`failClosed` is opt-in by design, NOT because the default is
fail-open in the dangerous sense. The trust-class default matrix
(`defaultInboundSanitization`) already neutralizes untrusted
content without `failClosed`:

- `mcp-derived` / `skill-untrusted` / `web-search` →
  `'detect-and-strip-and-wrap'`: matched imperative patterns are
  stripped AND the body is wrapped in the `<<<untrusted_content>>>`
  envelope, so injection is defanged while legitimate content (e.g.
  a web result that merely quotes "ignore previous instructions")
  still flows.
- `first-party-user-defined` / `skill-trusted` →
  `'detect-and-flag'`: flagged for operator visibility, body
  unchanged (the content origin is trusted).

`failClosed: true` upgrades a *hit* from "sanitize and continue" to
a hard block (`ToolError({ kind: 'inbound_sanitization_blocked' })`).
Operators running high-assurance deployments opt in per-tool via
`tool({ failClosed: true })`. Defaulting it to `true` globally would
convert every web-search / MCP result that quotes imperative text
into a tool failure — which is why it stays opt-in.

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
