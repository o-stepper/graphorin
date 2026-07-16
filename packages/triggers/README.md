# @graphorin/triggers

> Background-task scheduler for the Graphorin framework.

`@graphorin/triggers` ships durable cron / interval / idle / event
triggers with the same code path in library and server modes. The
package owns:

- An in-tree 5-field **cron parser** (`* * * * *`, ranges, lists,
  steps; no third-party dependency).
- A `Scheduler` runtime - a process-bound loop that fires registered
  triggers and persists their state via the `TriggerStore` contract
  from `@graphorin/core/contracts`.
- Per-trigger **catch-up policies** (`'none'` default, `'last'`,
  `'all'`) plus `maxCatchupRuns` and `catchupWindowMs` knobs.
- An **AsyncIterable lifecycle event stream** (`scheduler.events()`)
  so observability and tests can subscribe without monkey-patching.
- A one-time per-process **library-mode WARN** (`acknowledgeLibMode`
  to suppress) reminding library callers that triggers fire as long
  as the parent process lives.

## Install

```bash
pnpm add @graphorin/triggers @graphorin/store-sqlite
```

## Quick start

```ts
import { createScheduler, cron, interval, idle, event } from '@graphorin/triggers';
import { createSqliteStore } from '@graphorin/store-sqlite';

const store = await createSqliteStore({ path: './assistant.db' });
await store.init();

const scheduler = createScheduler({ store: store.triggers });

scheduler.register(
  cron('daily-digest', '0 9 * * *', async () => {
    // …compose and send a daily digest email
  }, { catchupPolicy: 'last' }),
);

scheduler.register(
  interval('poll-mailbox', 60_000, async () => {
    // …poll IMAP every minute
  }),
);

scheduler.register(
  idle('flush-buffer', 5 * 60_000, async () => {
    // …fires after the user has been idle for 5 minutes
  }),
);

// Idle triggers measure idleness relative to the activity feed:
// call this from your request/message handlers so "idle" means
// "no user activity", not "process started 5 minutes ago".
scheduler.recordActivity();

scheduler.register(
  event('on-handoff', 'session.handoff', async (payload) => {
    // …fires whenever a handoff event is published
  }),
);

await scheduler.start();
```

## License

MIT © 2026 Oleksiy Stepurenko.

---

**Project Graphorin** · v0.10.1 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>
