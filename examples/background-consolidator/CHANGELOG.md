# background-consolidator

## 0.1.0

Initial release of the long-lived background-consolidator demo. Wires `createBackgroundConsolidatorApp({...})` to a six-tier `Memory` whose consolidator runs on the `tier: 'cheap'` budget envelope (per RB-15 / DEC-144 — the framework default is `'free'`; this example overrides so the standard phase fires), drives the cron + interval + idle declarations through the `@graphorin/triggers` `Scheduler` backed by the durable SQLite `TriggerStore` (DEC-150), mounts the consolidator + scheduler on a `@graphorin/server` instance so `GET /v1/health` and `graphorin consolidator status` (CLI) report live state, exposes `runConsolidatorCycle({...})` for deterministic smoke coverage with `scheduler.fire(...)` instead of wall-clock waits, and ships a deterministic stub `Provider` so CI runs hermetically. The example proves trigger durability across simulated restart by sharing the same `TriggerStore` between two consecutive `createScheduler({...})` instances.
