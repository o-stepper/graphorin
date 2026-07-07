# @graphorin/core

> The dependency-free root package every other `@graphorin/*` package builds on.

`@graphorin/core` defines the **public type system** and the **cross-package
contracts** for the Graphorin framework. It contains no runtime: every
implementation (sandbox, secrets store, memory store, provider adapters,
agent runtime, workflow engine, server, …) lives in a sibling package and
depends on the interfaces declared here.

- **Status:** v0.7.0 - type and contract surface for the v0.1 release line.
- **License:** [MIT](./LICENSE) - © 2026 Oleksiy Stepurenko.
- **Engines:** Node.js 22+ (ESM only).
- **Runtime dependencies:** none.
- **Peer dependency:** `zod` (`^3.23 || ^4`) - used for schema-typed values
  (`stateSchema`, `inputSchema`, `outputSchema`, `EvalScorer`, …). Bring
  whichever Zod version your application already uses.

## Installation

```bash
pnpm add @graphorin/core zod
```

## What is in here?

The package is organized into four sub-modules with their own `exports`
sub-paths so that consumers can import only what they need:

| Sub-path                  | Contents                                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------- |
| `@graphorin/core`         | Re-export of the entire surface (types + contracts + utilities + channels).                             |
| `@graphorin/core/types`   | Plain TypeScript types: `Message`, `AgentEvent`, `WorkflowEvent`, `RunContext`, `RunState`, `Usage`, …   |
| `@graphorin/core/contracts` | Interfaces consumed by other `@graphorin/*` packages: `Provider`, `MemoryStore`, `Tracer`, `Sandbox`, … |
| `@graphorin/core/utils`   | Tiny dependency-free helpers: `collect`, `mapStream`, `merge`, `withSignal`, `md5`, `xxhash`, …          |
| `@graphorin/core/channels`| Workflow channel types (`LatestValue`, `Reducer`, `Stream`, `Barrier`, `Ephemeral`, `AnyValue`) plus the durable primitives `sleepFor` / `sleepUntil`, `awaitExternal`, and `requestApproval`. |

## Naming notes

- The workflow primitive set in `@graphorin/core/channels` is **Graphorin's
  own design**: `Directive` for control flow, `Dispatch` for dynamic tasks,
  `pause(value)` for programmatic suspension, the channel kinds
  `LatestValue`, `Reducer`, `Stream`, `Barrier`, `Ephemeral`, `AnyValue`,
  and the durable-suspension primitives `sleepFor` / `sleepUntil` (durable
  timers), `awaitExternal` (awakeables), and `requestApproval` (persisted
  approvals) that `@graphorin/workflow` executes.
  These names are part of the public API and must not be aliased to terms
  from other workflow libraries (a dedicated lint rule lands later in the
  release).
- `SecretValue` is exposed here as an **interface**, not a class: the runtime
  implementation lives in `@graphorin/security`. Downstream packages typing
  parameters as `SecretValue` therefore depend only on `@graphorin/core`.

## Stability

Every exported type is annotated with one of two TSDoc tags:

- `@stable` - covered by semver guarantees for the `v0.x` line.
- `@experimental` - may change between minor versions; a deprecation note
  in the `CHANGELOG.md` will accompany every removal.

The whole `@graphorin/core` surface ships as `@stable` today - the
`@experimental` tag is used in the packages where genuinely unsettled
corners live (`mcp`, `tools`, `security`, `skills`), not here. The
committed API report in `etc/core.api.md` is diffed in CI
(`check-api-report`), so every change to this public surface is
explicit in review.

## Versioning

`@graphorin/core` follows the same lockstep release as the rest of the
`@graphorin/*` packages while the framework is on the `0.x` line.

---

**Graphorin** · v0.7.0 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>
