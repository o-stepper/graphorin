[**Graphorin API reference v0.10.2**](../../index.md)

***

[Graphorin API reference](/api/index.md) / @graphorin/proactive

# @graphorin/proactive

Proactivity layer for the [Graphorin](https://github.com/o-stepper/graphorin) framework: the pieces that let a personal assistant act on a schedule instead of only answering.

- **Heartbeat** (`createHeartbeat`) - a checklist-driven periodic agent beat. An empty checklist skips the beat before any model call; a busy agent defers it (`Agent.isBusy()` or an injected `runGate`); active-hours windows keep the bot quiet at night; the all-quiet sentinel reply (`HEARTBEAT_OK`) is suppressed instead of delivered. Each beat runs on a cheap isolated profile: fresh session, fail-closed model pin (`pinnedProvider`), per-beat run budget.
- **Cron-leg tasks** (`createProactiveCronTask`) - "fresh session per fire" runners over durable `@graphorin/triggers` schedules with fail-closed model pinning and a deterministic no-recursive-scheduling guard.
- **Escalation ladder** - outcomes are the typed `notify | question | review | act` union from `@graphorin/core`; `act` is reachable only through an explicit per-task grant plus an active memory ingest gate (fail-closed config check).

```ts no-check
import { createHeartbeat } from '@graphorin/proactive';

const heartbeat = createHeartbeat({
  agent: heartbeatAgent, // a dedicated cheap agent (scaffold: 'minimal')
  scheduler,
  schedule: { every: 30 * 60 * 1000, jitterMs: 60_000 },
  checklist: async () => (await listDueReminders()).join('\n') || null,
  profile: { provider: cheapModel, budgetUsd: 0.05 },
  activeHours: { from: '08:00', to: '23:00', timezone: 'Europe/Kyiv' },
  onOutcome: async (o) => gateway.deliver({ identity: owner, text: o.text }),
});
await heartbeat.start();
```

Single-process by design: schedules ride `@graphorin/triggers`, whose SQLite store is single-process. See the proactivity guide page for the full picture: heartbeat vs cron-leg, the outcome ladder, `act` grants, budgets and active hours.

---

**Project Graphorin** · v0.10.2 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>

## Modules

| Module | Description |
| ------ | ------ |
| [](/api/@graphorin/proactive/README.md) | `@graphorin/proactive` - the proactivity layer of the Graphorin framework: a checklist-driven heartbeat runner (C1) and a cron-leg task runner (C2), both emitting the typed notify / question / review / act escalation ladder from `@graphorin/core`. |
| [package.json](/api/@graphorin/proactive/package.json/index.md) | - |
