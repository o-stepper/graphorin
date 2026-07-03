[**Graphorin API reference v0.5.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / redaction/imperative-patterns

# redaction/imperative-patterns

Imperative-pattern catalogue for inbound prompt-injection defence.

Sibling to BUILT\_IN\_PATTERNS (PII / secrets) — the two
catalogues are disjoint by construction. The imperative catalogue
is consumed by the inbound sanitization layer in `@graphorin/tools`
to scan tool / MCP results before they reach the agent's message
store; the PII / secrets catalogue is consumed by the outbound
exporter validators to scan span attributes before they reach an
exporter.

The patterns target the canonical English "ignore previous
instructions" / "system override" injection family — the concrete
surface that an untrusted-skill or MCP server result might use to
smuggle imperative content into the next provider call. The
catalogue is intentionally conservative: every entry has a fixed-
substring prefilter so the per-byte scan budget stays sub-millisecond
on typical 16 KB tool results.

## Interfaces

| Interface | Description |
| ------ | ------ |
| [ImperativePattern](/api/@graphorin/observability/redaction/imperative-patterns/interfaces/ImperativePattern.md) | One entry in the imperative-pattern catalogue. The shape mirrors BUILT\_IN\_PATTERNS so consumers can share scan / replace machinery, but the fields are typed as imperative-only so the two catalogues do not accidentally merge. |
| [ScanResult](/api/@graphorin/observability/redaction/imperative-patterns/interfaces/ScanResult.md) | Compiled scan helper. Returns the list of pattern names that fired AND the number of bytes the strip would remove if applied. Bounded by the budget hint — when exceeded, returns `null` to let the caller apply the best-effort `'detect-failed'` annotation. |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [ImperativePatternName](/api/@graphorin/observability/redaction/imperative-patterns/type-aliases/ImperativePatternName.md) | Stable name of an imperative pattern. The catalogue is curated; user-supplied patterns can use any identifier they want and will be passed through the sanitization layer alongside the built-ins. |

## Variables

| Variable | Description |
| ------ | ------ |
| [BUILT\_IN\_IMPERATIVE\_PATTERNS](/api/@graphorin/observability/redaction/imperative-patterns/variables/BUILT_IN_IMPERATIVE_PATTERNS.md) | The default-on imperative-pattern catalogue. Stable across patches; additions during the pre-1.0 window are minor-bumps because new patterns may produce additional `tool.inbound.sanitization.hit{...}` counter increments on existing deployments. |
| [IMPERATIVE\_PREFILTER\_SUBSTRINGS](/api/@graphorin/observability/redaction/imperative-patterns/variables/IMPERATIVE_PREFILTER_SUBSTRINGS.md) | Combined Aho-Corasick-style prefilter set across every pattern. Lower-cased substrings; consumers test the body once with the combined filter before iterating regexes. |

## Functions

| Function | Description |
| ------ | ------ |
| [scanImperativePatterns](/api/@graphorin/observability/redaction/imperative-patterns/functions/scanImperativePatterns.md) | Run the imperative-pattern scan against `body`. Patterns are iterated in catalogue order; the prefilter shortcut returns early for bodies that do not contain any imperative-family substring. |
| [stripImperativePatterns](/api/@graphorin/observability/redaction/imperative-patterns/functions/stripImperativePatterns.md) | Apply `pattern.mask` to every match of every pattern in `body`. Used by the `'detect-and-strip*'` policies. The mask is calibrated to NOT match any imperative pattern itself, so post-strip bodies do not trigger another scan hit on round trips. |
