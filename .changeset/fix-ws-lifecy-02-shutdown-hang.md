---
'@graphorin/server': patch
---

Fix graceful shutdown hanging forever with a connected WebSocket client (e2e 2026-07-16, WS-LIFECY-02, critical; also WS-LIFECY-01). `dispatcher.shutdown()` sent each subscription a `lifecycle`/`aborted` frame and cleared in-memory state but never closed the underlying sockets, so `http.Server.close()` waited on idle subscribers indefinitely and `stop()` (the SIGTERM path the CLI installs) never resolved - an always-on deployment's restart/deploy could only be forced with SIGKILL. `shutdown()` now closes every connected socket with the documented `server.shutdown` close code (4007), which also fixes the previously-unemitted 4007 code, and `stop()` gains a drain-budget fallback that force-closes any lingering connection so it cannot hang even on a stalled close handshake. A regression test asserts `stop()` completes promptly with an idle and a subscribed WebSocket client connected, and that the client receives close code 4007.
