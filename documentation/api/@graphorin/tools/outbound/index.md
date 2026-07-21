[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / outbound

# outbound

`@graphorin/tools/outbound` - single-source outbound commentary
pattern catalogue + envelope helpers shared by the server delivery
layer, the session-output boundary and the channel gateway.

## Interfaces

| Interface | Description |
| ------ | ------ |
| [OutboundCommentaryPattern](/api/@graphorin/tools/outbound/interfaces/OutboundCommentaryPattern.md) | Single pattern entry in the [OUTBOUND\_COMMENTARY\_PATTERNS](/api/@graphorin/tools/outbound/variables/OUTBOUND_COMMENTARY_PATTERNS.md) catalogue. |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [OutboundCommentaryPolicy](/api/@graphorin/tools/outbound/type-aliases/OutboundCommentaryPolicy.md) | Operator-facing policy shared by all outbound commentary sanitizers. |
| [OutboundCommentaryReason](/api/@graphorin/tools/outbound/type-aliases/OutboundCommentaryReason.md) | Stable label for each detection pattern. Surfaced in audit rows; the counter label cardinality is bounded. |

## Variables

| Variable | Description |
| ------ | ------ |
| [COMMENTARY\_WRAP\_CLOSE](/api/@graphorin/tools/outbound/variables/COMMENTARY_WRAP_CLOSE.md) | Default wrap-envelope close delimiter. See [COMMENTARY\_WRAP\_OPEN](/api/@graphorin/tools/outbound/variables/COMMENTARY_WRAP_OPEN.md). |
| [COMMENTARY\_WRAP\_OPEN](/api/@graphorin/tools/outbound/variables/COMMENTARY_WRAP_OPEN.md) | Default wrap-envelope open delimiter shared by all outbound sanitizers, so a fragment wrapped at one boundary is recognized (and never re-wrapped) at every other boundary. |
| [OUTBOUND\_COMMENTARY\_PATTERNS](/api/@graphorin/tools/outbound/variables/OUTBOUND_COMMENTARY_PATTERNS.md) | The framework-shipped catalogue: the seven event-shape signatures the agent runtime can emit which, if leaked into user-visible text, disclose internal tool execution detail. Bytes-equal across every boundary that consumes it; idempotent on a single payload (the wrap envelope itself is not matched by any pattern, so a second pass over previously-sanitized output is a no-op). |

## Functions

| Function | Description |
| ------ | ------ |
| [freshRegex](/api/@graphorin/tools/outbound/functions/freshRegex.md) | Clone a regex before every scan. RegExp instances with the `g` flag carry a mutable `lastIndex`; cloning keeps sanitizers built over the shared catalogue stateless. |
| [sha256Hex](/api/@graphorin/tools/outbound/functions/sha256Hex.md) | Hex-encoded SHA-256 of a UTF-8 string. Used for the before/after digests on sanitization audit rows (raw payloads never reach the audit log). |
| [splitByWrapEnvelope](/api/@graphorin/tools/outbound/functions/splitByWrapEnvelope.md) | Split a body into already-wrapped + plain segments so a sanitizer never re-scans inside an existing wrap envelope. This is the idempotency primitive that makes layered outbound sanitization (storage-write, wire-emission, channel delivery) composable: a second pass over previously-sanitized output is bytes-equal. |
