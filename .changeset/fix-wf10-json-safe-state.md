---
'@graphorin/workflow': minor
---

Checkpoint state is validated for JSON-safety at persist time on EVERY store (WF-10): a Map/Set/Date/class instance in a channel now fails fast with the typed `state-not-serializable` error naming the channel and path, instead of round-tripping in dev (in-memory structuredClone) and silently degrading to `{}`/strings in production (SQLite JSON.stringify).
