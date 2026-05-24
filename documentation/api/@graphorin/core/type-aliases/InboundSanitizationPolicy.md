[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / InboundSanitizationPolicy

# Type Alias: InboundSanitizationPolicy

```ts
type InboundSanitizationPolicy = 
  | "pass-through"
  | "detect-and-flag"
  | "detect-and-strip"
  | "detect-and-wrap"
  | "detect-and-strip-and-wrap";
```

Defined in: packages/core/src/types/tool.ts:78

Inbound prompt-injection sanitization policy applied to a tool's
result body before it reaches the conversation history.

- `'pass-through'`              — no scan; bytes-equal forwarding
  (the trusted-built-in default).
- `'detect-and-flag'`           — scan; emit a flag span attribute
  + audit row but do not modify the body.
- `'detect-and-strip'`          — replace each match with the
  `[REDACTED:imperative-pattern]` literal token.
- `'detect-and-wrap'`           — wrap the body in the
  `<<<untrusted_content>>>` envelope without stripping matches.
- `'detect-and-strip-and-wrap'` — both strip matches and wrap the
  resulting body (the untrusted-source default).

## Stable
