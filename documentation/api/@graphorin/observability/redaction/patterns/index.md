[**Graphorin API reference v0.13.11**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / redaction/patterns

# redaction/patterns

Built-in PII / secret detection patterns. The catalogue is intentionally
conservative - every pattern has both positive and negative test
fixtures and is documented so operators understand exactly what is
matched.

The catalogue is split into two groups:

- **secret** - credentials, API tokens, JWTs, private keys. Matches
  are always dropped + counted, regardless of the configured tier
  floor.
- **pii** - email / phone / IBAN / credit card / SSN / IP address.
  Subject to the configured tier floor + per-pattern enable / disable
  knobs.

## Interfaces

| Interface | Description |
| ------ | ------ |
| [JsonSafeSpan](/api/@graphorin/observability/redaction/patterns/interfaces/JsonSafeSpan.md) | A replacement decision from [jsonSafeSpan](/api/@graphorin/observability/redaction/patterns/functions/jsonSafeSpan.md): replace `source.slice(start, end)` with `text`. `start` normally equals the match index; it moves one lexeme left only when a leading minus sign has to be absorbed so a signed numeric leaf stays parseable. |
| [RedactionPattern](/api/@graphorin/observability/redaction/patterns/interfaces/RedactionPattern.md) | One entry in the redaction catalogue. |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [BuiltInPatternName](/api/@graphorin/observability/redaction/patterns/type-aliases/BuiltInPatternName.md) | Stable pattern identifier. The catalogue is curated; user-supplied patterns can use any identifier they want and will be passed through the validator in addition to the built-ins. |
| [PatternCategory](/api/@graphorin/observability/redaction/patterns/type-aliases/PatternCategory.md) | Pattern category - `secret` matches always force a drop; `pii` matches respect the configured `enabledPatterns` allow-list. |

## Variables

| Variable | Description |
| ------ | ------ |
| [ALL\_BUILT\_IN\_PATTERNS](/api/@graphorin/observability/redaction/patterns/variables/ALL_BUILT_IN_PATTERNS.md) | Full registry - for tooling that wants to introspect every pattern the framework knows about (e.g. CLI `graphorin redaction list`). |
| [BUILT\_IN\_PATTERNS](/api/@graphorin/observability/redaction/patterns/variables/BUILT_IN_PATTERNS.md) | The 14 default-on built-in patterns (the IPv4 and IPv6 detectors are opt-in and live in [OPT\_IN\_PATTERNS](/api/@graphorin/observability/redaction/patterns/variables/OPT_IN_PATTERNS.md)). |
| [OPT\_IN\_PATTERNS](/api/@graphorin/observability/redaction/patterns/variables/OPT_IN_PATTERNS.md) | Patterns that are recognised by the validator but are NOT enabled by default. Use them via `patterns: [...BUILT_IN_PATTERNS, ...OPT_IN_PATTERNS]`. |

## Functions

| Function | Description |
| ------ | ------ |
| [jsonSafeMask](/api/@graphorin/observability/redaction/patterns/functions/jsonSafeMask.md) | String-returning wrapper around [jsonSafeSpan](/api/@graphorin/observability/redaction/patterns/functions/jsonSafeSpan.md) for callers that replace exactly the matched span. Because its signature cannot widen the replaced region, it CANNOT absorb the leading minus of a signed numeric leaf - for `{"card":-4111111111111111}` it returns the plain unquoted mask (its historical behaviour), which leaves the document unparseable. Prefer [jsonSafeSpan](/api/@graphorin/observability/redaction/patterns/functions/jsonSafeSpan.md) in new code; this wrapper is kept for custom catalogues that adopted it in 0.13.4. The same whole-text ambiguity documented on [jsonSafeSpan](/api/@graphorin/observability/redaction/patterns/functions/jsonSafeSpan.md) applies. |
| [jsonSafeSpan](/api/@graphorin/observability/redaction/patterns/functions/jsonSafeSpan.md) | Grammar-preserving mask placement. When the matched span occupies a bare JSON *value* position - the nearest non-whitespace neighbour on the left is `:` / `,` / `[` (or the start of the text) and on the right `,` / `}` / `]` (or the end of the text) - the mask is wrapped in double quotes, so masking a raw numeric leaf (`{"card":4111111111111111}`) yields a document that still parses (`{"card":"[REDACTED creditcard]"}`). A leading minus sign is part of the value position: for `{"card":-4111111111111111}` the returned span absorbs the sign (`start` moves to the `-`), because a mask emitted after a stranded sign (`-"[REDACTED ...]"`) would not parse. Everywhere else (prose, CSV, inside a JSON string leaf) the mask is returned unquoted and the span covers exactly the match. The text is never parsed, so lexemes outside the returned span keep their exact source form. |
