# background-consolidator

> A long-lived **graphorin** agent that runs the six-tier `Memory` consolidator on a cron + interval + idle schedule, observable through `GET /v1/health` and `graphorin consolidator status`. Demonstrates the production trigger-durability contract (DEC-150) and the `tier: 'cheap'` budget envelope (RB-15 / DEC-144).

The example is the smallest end-to-end illustration of the consolidator daemon: declare your trigger schedule once, hand it to a `Scheduler` from `@graphorin/triggers`, mount the `Consolidator` on a `@graphorin/server` instance, and let the `light` + `standard` phases run themselves while the agent handles user turns.

---

## Prerequisites

- **Node.js 22.12+** (the workspace pins `>=22.12.0`).
- **pnpm 10.28+** (`corepack enable && corepack prepare pnpm@10.28.2 --activate`).
- No external services required. The example ships a deterministic stub `Provider` so smoke coverage runs hermetically; swap in any `Provider` (Ollama, llama.cpp, …) by passing `providerOverride`.

---

## Quick start

From the workspace root:

```bash
pnpm install
pnpm --filter ./examples/background-consolidator build
pnpm --filter ./examples/background-consolidator test
pnpm --filter ./examples/background-consolidator dev
```

Expected output:

```
graphorin v0.8.0 background-consolidator - recipe='stub', tier='cheap', running=true, turnsDriven=4, lightPhases=4, standardPhases=4, schedulerFires=1, triggers=[background-consolidator:idle-probe, background-consolidator:light-tick, consolidator:cron:0 3 * * *, consolidator:idle:10s].
```

The dev script boots the app against `:memory:` SQLite, drives one cycle through `runConsolidatorCycle({ ... })`, prints the consolidator status, and exits cleanly.

---

## How the pieces fit

The example wires four moving parts together:

1. **`Memory` with a real consolidator.** `createMemory({ consolidator: { enabled: true, tier: 'cheap', triggers, provider, defaultScope } })` swaps the Phase 10a placeholder for the production runtime so the `light` + `standard` phases actually execute.
2. **`Scheduler` from `@graphorin/triggers`.** The scheduler is constructed against the SQLite-backed `TriggerStore`. Trigger declarations become rows in `trigger_state`; the durable layer is what survives process restart per DEC-150.
3. **`registerConsolidatorTriggers(consolidator, scheduler, { scope })`.** The bridge walks the consolidator's `triggers: [...]` list, parses each spec, and registers the cron / idle / interval kinds with the scheduler. The callback fires `consolidator.trigger(reason, scope)` so the lib-mode + server paths converge on the same handler. Turn / event / budget triggers are skipped here - the scheduler cannot count user turns autonomously.
4. **`createServer({ consolidator, triggers: { scheduler } })`.** The standalone server hosts the consolidator daemon under its own lifecycle hooks. `GET /v1/health` reports `consolidator.running`, `consolidator.queueDepth`, and the active budget envelope; `graphorin consolidator status` (CLI, Phase 15) reads from the same daemon.

```ts
import {
  createBackgroundConsolidatorApp,
  runConsolidatorCycle,
} from '@graphorin/example-background-consolidator';

const app = await createBackgroundConsolidatorApp({
  recipe: 'stub',
  dbPath: '/var/lib/graphorin/consolidator.db',
});

// Light + standard phases now fire on the consolidator's declared
// schedule (`turn:3` + `idle:10s` + `cron:0 3 * * *` by default).

const cycle = await runConsolidatorCycle({ app, turns: 4, durationMs: 1_000 });
console.log(cycle.status.tier);            // → 'cheap'
console.log(cycle.status.lastRuns.light);  // → ISO-8601 timestamp
console.log(cycle.snapshot.map((t) => t.id));
//   → ['background-consolidator:idle-probe',
//      'background-consolidator:light-tick',
//      'consolidator:cron:0 3 * * *',
//      'consolidator:idle:10s']
```

---

## Per-trigger declarations

The example registers two layers of triggers:

```ts
import { cron, idle, interval } from '@graphorin/triggers';

// 1) Spec-derived triggers - one per ConsolidatorTriggerSpec, parsed
//    by registerConsolidatorTriggers(...). The callback bound by the
//    bridge calls `consolidator.trigger(reason, scope)` so the cron
//    + idle parsings stay traceable end-to-end.
//
//    Default spec list (see DEFAULT_TRIGGERS):
//      'turn:3'         - light + standard after every 3 turns (lib-side)
//      'idle:10s'       - light + standard after 10s of no activity
//      'cron:0 3 * * *' - nightly maintenance window for deep replays

// 2) Operator-owned triggers - wired directly with `interval(...)` /
//    `idle(...)` so the example exposes a stable id callers can fire
//    deterministically (e.g. from CI smoke coverage):
const lightTick = interval(
  'background-consolidator:light-tick',
  60_000,
  async () => {
    await app.memory.consolidator.fireNow('light', app.scope);
  },
  { acknowledgeLibMode: true },
);

const idleProbe = idle(
  'background-consolidator:idle-probe',
  30_000,
  async () => {
    await app.memory.consolidator.trigger({ kind: 'idle', value: 'idle-probe' }, app.scope);
  },
  { acknowledgeLibMode: true },
);

await app.scheduler.register(lightTick);
await app.scheduler.register(idleProbe);
```

Both layers are fully durable through the SQLite `TriggerStore` - every `register(...)` call upserts a row keyed by `id`, so the next process can reuse the same id and pick up the existing schedule.

> **Library mode.** Pass `{ acknowledgeLibMode: true }` to suppress the per-process WARN that fires when callers register triggers without server-side ownership. The example threads the flag through `registerConsolidatorTriggers({ acknowledgeLibMode: true })` and through every operator-owned `interval(...)` / `idle(...)` declaration.

---

## Light + standard consolidator phases

The consolidator runs three named phases; this example exercises the first two:

| Phase      | When it fires                                                                          | What it persists                                                                       |
| ---------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `light`    | After every N turns (`turn:3`), every idle window (`idle:10s`), or every manual tick.  | Decays the retention curve, archives stale facts, runs the noise filter. **No LLM.**   |
| `standard` | Same triggers as `light`, gated by tier (only fires for `'cheap'` and above).          | Extracts new facts via the cheap LLM model and routes them through `semantic.remember`. |
| `deep`     | Cron + manual fires only (e.g. nightly). Requires tier ≥ `'standard'`.                 | Resolves any conflicts surfaced by the standard phase via the deep LLM judge.          |

In the default `tier: 'cheap'` config, the example runs `light` + `standard` on every turn-, idle-, and operator-driven tick. The deep phase stays gated until the operator switches to `tier: 'standard'` or higher.

### Observe a phase end-to-end

The smoke test wires an `onPhaseFinished(...)` listener so each completed phase is observable from outside the consolidator runtime:

```ts
const unsubscribe = app.memory.consolidator.onPhaseFinished((outcome) => {
  console.log(
    `[consolidator] phase=${outcome.phase} status=${outcome.status} ` +
      `factsCreated=${outcome.factsCreated} ` +
      `noiseFilteredCount=${outcome.noiseFilteredCount} ` +
      `llmTokensUsed=${outcome.llmTokensUsed}`,
  );
});
// ...
unsubscribe();
```

Or hit the server endpoint directly:

```bash
# After `await app.server.start()` (or `graphorin start`):
curl -s http://127.0.0.1:8080/v1/health | jq '.consolidator'
#   {
#     "tier": "cheap",
#     "running": true,
#     "paused": false,
#     "queueDepth": 0,
#     "dlqSize": 0,
#     "deferredRuns": 0,
#     "emptyExtractions": 0,
#     "budget": {
#       "tokensUsedToday": 0,
#       "costUsedToday": 0,
#       "tokensRemaining": 50000,
#       "costRemaining": 0.2,
#       "resetAt": "2026-05-10T00:00:00.000Z"
#     }
#   }
```

The same status is what the CLI command surfaces:

```bash
graphorin consolidator status
#   tier:           cheap
#   running:        true
#   light last run: 2026-05-09T17:42:01.342Z
#   queue depth:    0
#   budget left:    50,000 tokens / $0.20
```

---

## `tier: 'cheap'` budget configuration (and how to switch back to `'free'`)

The framework default per ADR-038 §4 is `tier: 'free'` - every LLM phase is disabled, the daily token / cost ceilings are pinned at `0`, and only the `light` phase runs. That is the right posture for personal assistants where the operator never wants a surprise bill.

This example overrides to `tier: 'cheap'` so the standard phase actually fires:

```ts
const memory = createMemory({
  store: store.memory,
  embeddings: store.embeddings,
  consolidator: {
    enabled: true,
    tier: 'cheap',                  // ← actually exercise the standard phase
    triggers: ['turn:3', 'idle:10s', 'cron:0 3 * * *'],
    provider,                       // required by the standard phase
    defaultScope: { userId, sessionId, agentId },
  },
});
```

The `'cheap'` preset (`CONSOLIDATOR_TIER_DEFAULTS.cheap`) ships:

| Knob                | Value          |
| ------------------- | -------------- |
| `maxTokensPerDay`   | `50_000`       |
| `maxCostPerDay`     | `$0.20`        |
| `maxConcurrentRuns` | `1`            |
| `cooldownMs`        | `60_000` (1 m) |
| `phases`            | `['light', 'standard']` |
| `onExceed`          | `'pause'`      |

To switch back to zero-cost mode at runtime:

```ts
await app.memory.consolidator.setTier('free');
//   → only light phase will run; daily ceilings drop to 0 again.
```

Or pass `tier: 'free'` to `createBackgroundConsolidatorApp({ tier: 'free' })` for a cold start without any LLM activity. The `'standard'` and `'full'` presets widen the envelope further; see `@graphorin/memory`'s `CONSOLIDATOR_TIER_DEFAULTS` for the full table.

---

## Trigger durability across restart (DEC-150)

The SQLite `TriggerStore` (`packages/store-sqlite/src/trigger-store.ts`) is the durable layer behind the scheduler. Every `scheduler.register(decl)` call upserts a row in `trigger_state`; every `scheduler.fire(id)` updates `last_fired_at` + `next_fire_at` atomically. After a process restart the new scheduler iterates the persisted state, schedules the next fire window, and applies the configured `catchupPolicy` (`'none'` | `'last'` | `'all'`).

The smoke test exercises this directly:

```ts
const store = await createSqliteStore({ path: ':memory:', disableWalHardening: true });
await store.init();

const scheduler1 = createScheduler({ store: store.triggers, mode: 'lib' });
await scheduler1.register(
  interval('restart-survivor', 60_000, async () => {}, { acknowledgeLibMode: true }),
);
await scheduler1.start();
await scheduler1.stop();

// Simulated restart - same durable TriggerStore, brand-new scheduler.
const scheduler2 = createScheduler({ store: store.triggers, mode: 'lib' });
const survivors = await scheduler2.list();
//   → [{ id: 'restart-survivor', kind: 'interval', spec: '60000', ... }]
```

A real production deployment uses a file path (not `:memory:`) so the rows survive across `systemctl restart`, OS reboot, or container redeploy.

---

## Production deployment

For long-lived background consolidator workloads, run the example under systemd. The framework ships a hardened unit template at [`examples/systemd/graphorin.service`](../systemd/graphorin.service):

```bash
sudo cp examples/systemd/graphorin.service /etc/systemd/system/graphorin.service
sudo systemctl daemon-reload
sudo systemctl enable --now graphorin.service
sudo systemctl status graphorin.service
sudo systemd-analyze security graphorin.service   # target score < 5
```

Key knobs already wired into the unit:

- `User=graphorin` / `Group=graphorin` - drops privileges; the framework refuses to run as root.
- `ProtectSystem=strict` + `ReadWritePaths=/var/lib/graphorin` - only the data dir is writable.
- `RestrictAddressFamilies=AF_INET AF_INET6 AF_UNIX` + `SystemCallFilter=@system-service` - minimal syscall surface.
- `Restart=on-failure` + `StartLimitBurst=5` - self-heals through transient errors without runaway restart loops.
- `KillSignal=SIGTERM` + `TimeoutStopSec=30` - gives the consolidator + scheduler 30 s to drain in-flight phases before SIGKILL.

### Log rotation

The unit pipes `StandardOutput=journal` + `StandardError=journal`, so journald is the canonical log sink:

```bash
journalctl -u graphorin.service --since "1 hour ago"
```

If you instead route logs to a file (e.g. through the `@graphorin/observability` `logger` exporter), pair it with `logrotate(8)` (or your distro's equivalent):

```
/var/log/graphorin/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
    create 0640 graphorin graphorin
}
```

Keep the rotation count generous - consolidator phase outcomes are the audit trail you need when a budget event surfaces and you have to reconstruct what the standard phase actually did.

---

## Public API

The example exports a small, typed surface other packages can build on:

- `createBackgroundConsolidatorApp({ recipe?, dbPath?, tier?, triggers?, ... })` - boots the app handle. Lib-mode by default; the inner `server` is constructed but inert until you call `server.start()`.
- `startBackgroundConsolidator({ ... })` - convenience wrapper that calls `app.server.start()` and returns the same handle.
- `runConsolidatorCycle({ app, turns?, durationMs?, fireTriggerIds? })` - drives a deterministic cycle (synthetic turns + `scheduler.fire(...)`) and returns `{ snapshot, status, eventCounts, turnsDriven, outcomes }`.
- `BACKGROUND_TICK_TRIGGER_ID`, `IDLE_PROBE_TRIGGER_ID`, `DEFAULT_TRIGGERS` - stable ids and the default consolidator trigger list.

All public files start with the canonical `Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko` header and use only the public types from `@graphorin/agent`, `@graphorin/core`, `@graphorin/memory`, `@graphorin/sessions`, `@graphorin/triggers`, `@graphorin/server`, `@graphorin/store-sqlite`.

---

## Observability

Set **`GRAPHORIN_TRACE=console`** for terminal span export via `@graphorin/example-trace-helper`. Persisted SQLite traces are surfaced by **`graphorin traces`** when using the standalone server. Full notes: [`TRACING.md`](../TRACING.md).

---

**Graphorin** · v0.8.0 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>
