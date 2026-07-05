---
'@graphorin/server': patch
---

Security fix (W-027): the WebSocket replay path now sanitizes every buffered frame with the same delivery-commentary sanitizer as the live path and the SSE replay. Previously a fresh WS subscription (or a reconnect-resume) received up to 1000 raw buffered frames, bypassing the `wrap`/`strip` commentary policy and its audit decisions exactly on the reconnect scenario the buffer exists for. Delivery now goes through a single `dispatchSanitized` choke point shared by the live and replay paths, so future delivery paths cannot silently bypass the sanitizer; replayed bytes are identical to live bytes for the same frame (single sanitize per delivery, no double-wrap), and the `lastEventId` ordering invariant is unchanged.
