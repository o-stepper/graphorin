---
'@graphorin/memory': patch
'@graphorin/server': patch
---

fix(server): wire the consolidator's triggers into the server scheduler; make the deep phase reachable (MCON-4, MCON-5)

Background consolidation never ran in server mode. The runtime docstring
claimed the server "pipes turn / idle / cron triggers into
`Consolidator.trigger(...)`", but nothing did: the server started the triggers
daemon and the consolidator daemon independently with no bridge, the server's
`ConsolidatorLike` didn't even expose `trigger()`, and there were zero
production calls to `registerConsolidatorTriggers`. On top of that the deep
phase was unreachable by default — `#planPhases` only schedules `deep` for
`cron` / `manual` / `budget` reasons, while the default triggers were
`['turn:20', 'idle:5m']`, so the deferred conflict-check queue grew unbounded.

- New `Consolidator.registerWithScheduler(scheduler)` self-registers the
  consolidator's cron / idle triggers (via the existing
  `registerConsolidatorTriggers`) using the configured `defaultScope`. The
  server calls it in `beforeStart` whenever a consolidator **and** a triggers
  scheduler are both supplied — so consolidation fires with no manual wiring.
  It keeps `@graphorin/server` decoupled from `@graphorin/memory`
  (`ConsolidatorLike` gains an optional, structurally-typed method).
- Default triggers are now `['idle:5m', 'cron:0 4 * * *']`: the daily cron
  makes the **deep** phase reachable (drains deferred conflicts + runs
  reflection). The inert `turn:20` default was dropped — the scheduler can't
  count user turns, so a turn trigger only fires when a consumer emits
  `trigger({ kind: 'turn' }, ...)` itself.
- Corrected the false runtime docstring and documented the bridge in the
  standalone-server guide.

Tests: a server lifecycle test (the bridge wires on `start()` — red-before /
green-after) and memory tests (the default registers the deep-reaching cron;
`registerWithScheduler` throws without a `defaultScope`).
