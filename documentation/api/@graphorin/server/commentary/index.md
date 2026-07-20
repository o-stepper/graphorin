[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / commentary

# commentary

Delivery-layer commentary-phase trace sanitization for
`@graphorin/server`.

## Interfaces

| Interface | Description |
| ------ | ------ |
| [CommentaryAuditSink](/api/@graphorin/server/commentary/interfaces/CommentaryAuditSink.md) | A commentary sink that also exposes a `drain()` so callers (and tests) can await any in-flight audit writes. |
| [LateBoundCommentarySink](/api/@graphorin/server/commentary/interfaces/LateBoundCommentarySink.md) | A [DeliveryCommentarySink](/api/@graphorin/server/interfaces/DeliveryCommentarySink.md) whose real target is installed later. The WS dispatcher is created before the audit DB opens; the server hands it this forwarding sink and calls [LateBoundCommentarySink.bind](/api/@graphorin/server/commentary/interfaces/LateBoundCommentarySink.md#bind) once the audit-writing sink exists. Decisions emitted before binding are dropped - the dispatcher only sanitizes once it is live (after `start()`, by which point the audit DB, if configured, has opened and bound). |

## Variables

| Variable | Description |
| ------ | ------ |
| [COMMENTARY\_AUDIT\_ACTION](/api/@graphorin/server/commentary/variables/COMMENTARY_AUDIT_ACTION.md) | Audit action recorded for a delivery-commentary sanitization decision. |

## Functions

| Function | Description |
| ------ | ------ |
| [bridgeCommentaryToAudit](/api/@graphorin/server/commentary/functions/bridgeCommentaryToAudit.md) | Build a commentary sink that appends each sanitization decision to the audit log. Writes serialise through `appendAudit` so concurrent decisions never race on `seq`; a failed write is isolated from the wire - `onWriteError` (default: a console warning) runs instead of throwing. |
| [commentaryDecisionToAuditInput](/api/@graphorin/server/commentary/functions/commentaryDecisionToAuditInput.md) | Translate a sanitizer decision into an audit entry. The digests + matched pattern bucket land in `metadata`; raw payloads never do (the sanitizer only ever exposes SHA-256s of the before/after bodies). |
| [createLateBoundCommentarySink](/api/@graphorin/server/commentary/functions/createLateBoundCommentarySink.md) | - |

## References

### createDeliveryCommentarySanitizer

Re-exports [createDeliveryCommentarySanitizer](/api/@graphorin/server/functions/createDeliveryCommentarySanitizer.md)

***

### DEFAULT\_APPLY\_TO\_EVENTS

Re-exports [DEFAULT_APPLY_TO_EVENTS](/api/@graphorin/server/variables/DEFAULT_APPLY_TO_EVENTS.md)

***

### DEFAULT\_DELIVERY\_COMMENTARY\_PATTERNS

Re-exports [DEFAULT_DELIVERY_COMMENTARY_PATTERNS](/api/@graphorin/server/variables/DEFAULT_DELIVERY_COMMENTARY_PATTERNS.md)

***

### DeliveryCommentaryConfig

Re-exports [DeliveryCommentaryConfig](/api/@graphorin/server/interfaces/DeliveryCommentaryConfig.md)

***

### DeliveryCommentaryDecision

Re-exports [DeliveryCommentaryDecision](/api/@graphorin/server/interfaces/DeliveryCommentaryDecision.md)

***

### DeliveryCommentaryPattern

Re-exports [DeliveryCommentaryPattern](/api/@graphorin/server/interfaces/DeliveryCommentaryPattern.md)

***

### DeliveryCommentaryPolicy

Re-exports [DeliveryCommentaryPolicy](/api/@graphorin/server/type-aliases/DeliveryCommentaryPolicy.md)

***

### DeliveryCommentaryReason

Re-exports [DeliveryCommentaryReason](/api/@graphorin/server/type-aliases/DeliveryCommentaryReason.md)

***

### DeliveryCommentarySanitizer

Re-exports [DeliveryCommentarySanitizer](/api/@graphorin/server/interfaces/DeliveryCommentarySanitizer.md)

***

### DeliveryCommentarySink

Re-exports [DeliveryCommentarySink](/api/@graphorin/server/interfaces/DeliveryCommentarySink.md)

***

### DeliveryCommentaryTransport

Re-exports [DeliveryCommentaryTransport](/api/@graphorin/server/type-aliases/DeliveryCommentaryTransport.md)
