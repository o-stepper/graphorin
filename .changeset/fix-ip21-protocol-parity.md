---
'@graphorin/protocol': minor
'@graphorin/server': patch
'@graphorin/client': patch
---

fix: protocol/server parity — drop dead lastSequenceId + correct pre-init error code (IP-21)

- The `subscription.subscribe` schema accepted a `lastSequenceId` field that the
  client never set and the server never read — a dead wire surface alongside
  the working `sinceEventId` cursor. It is removed from the protocol schema and
  the client's params type.
- A WebSocket frame sent before `initialize` was answered with `AUTH_REQUIRED`
  (`-32001`), but the connection is already authenticated — it is a protocol
  sequencing error. It now returns `PROTOCOL_VIOLATION` (`-32005`).

(The remaining IP-21 sub-item — wiring the delivery-commentary sanitizer's
audit decisions into the audit log when an audit DB is configured — is a
separate follow-up; it needs an audit-bridging `DeliveryCommentarySink` and
careful ordering since the audit DB opens after the dispatcher.)
