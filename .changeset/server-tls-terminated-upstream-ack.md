---
'@graphorin/server': patch
---

The server now states its TLS posture explicitly: it serves plaintext HTTP only (no in-process TLS by design), and binding a non-loopback host logs a startup WARN until the operator acknowledges the fronting reverse proxy with the new `server.tlsTerminatedUpstream: true` config flag. The flag records intent and silences the warning; it changes no runtime behaviour.
