---
'@graphorin/triggers': patch
'@graphorin/server': patch
---

fix(server): trigger enable/disable are flag flips; DELETE is the destructive removal (IP-17)

The REST routes documented `POST /triggers/:id/enable` but never registered
it, and `disable` destructively called `scheduler.unregister(...)` — one verb,
two contradicting behaviors vs the CLI (which flips the persistent flag).

- `@graphorin/triggers`: new `Scheduler.setDisabled(id, disabled)` — the
  non-destructive flag flip. Disabling cancels the armed timer but keeps the
  trigger registered + persisted; enabling recomputes the next fire **from
  now** (a stale pre-disable `nextFireAt` would clamp to 0 and fire
  immediately) and re-arms.
- `@graphorin/server`: `POST /:id/disable` and the now-real `POST /:id/enable`
  call `setDisabled`; the destructive removal is `DELETE /:id` (404 on
  repeat). CLI and REST agree; `standalone-server.md` documents the routes.
