# @graphorin/core

## 0.5.0

First version published to the npm registry (with Sigstore build
provenance). The 0.2.0, 0.3.0, and 0.4.0 versions were internal lockstep
milestones and were never published. All `@graphorin/*` packages release
lockstep at the same version; the full release notes for 0.2.0-0.5.0 live
in the repository-level
[CHANGELOG](https://github.com/o-stepper/graphorin/blob/main/CHANGELOG.md).

## 0.1.0

### Minor Changes

- Initial release of the dependency-free root package for the Graphorin
  framework. Ships the public type system (`Message`, `AgentEvent`,
  `WorkflowEvent`, `RunContext`, `RunState`, `Usage`, `Sensitivity`,
  `MemoryKind`, `MemoryMetadata`, `Handoff`, `StopCondition`, …), every
  cross-package contract interface (`Provider`, `Tool`, `Logger`,
  `MemoryStore`, `CheckpointStore`, `SessionStore`, `TriggerStore`,
  `AuthTokenStore`, `EmbedderProvider`, `TokenCounter`, `Tracer`,
  `AISpan`, `RedactionValidator`, `SecretsStore`, `SecretValue`,
  `SecretRef`, `SecretResolver`, `Sandbox`, `EvalScorer`, …) and a small
  set of dependency-free utilities (`collect`, `mapStream`, `merge`,
  `withSignal`, `assertNever`, `md5`, `xxhash`, …).
- Workflow channel primitives under `@graphorin/core/channels`:
  `Directive`, `Dispatch`, `pause`, `LatestValue`, `Reducer`, `Stream`,
  `Barrier`, `Ephemeral`, `AnyValue`, `ListAggregate` — Graphorin's own
  vocabulary; names are part of the public API.
- Typed no-op defaults `NOOP_TRACER` and `NOOP_LOGGER` so downstream
  packages can carry a non-null observability surface without taking the
  observability dependency.
- `zod` is declared as a peer dependency (`^3.23 || ^4`); `@graphorin/core`
  has no other runtime dependencies and no internal dependencies on any
  other `@graphorin/*` package.
