---
'@graphorin/core': minor
---

Initial release of `@graphorin/core` — the dependency-free root package
every other `@graphorin/*` package builds on. Ships:

- The full public **type** surface: `Message`, `MessageContent`,
  `AgentEvent`, `WorkflowEvent`, `Tool*` (call / result / error / approval
  / completed), `RunContext`, `RunState`, `RunStep`, `Usage`,
  `UsageAccumulator`, `Cost`, `Sensitivity`, `SessionScope`, `MemoryKind`,
  `MemoryMetadata`, `MemoryRecord`, `Block`, `Fact`, `Episode`, `Rule`,
  `Handoff`, `HandoffFilter`, `HandoffRecord`, `StopCondition`.
- The full public **contract** surface: `Provider`, `ProviderRequest`,
  `ProviderResponse`, `ProviderEvent`, `ProviderMiddleware`,
  `ComposeProviderMiddleware`, `TokenCounter`, `EmbedderProvider`,
  `Tool`, `ToolExecutionContext`, `ToolReturn`, `Logger` (+
  `NOOP_LOGGER`), `MemoryStore` (with the six tier sub-namespaces),
  `CheckpointStore`, `SessionStore`, `TriggerStore`, `AuthTokenStore`,
  `Tracer`, `AISpan`, `SpanType` (+ `NOOP_TRACER`), `RedactionValidator`,
  `SecretsStore`, `SecretResolver`, `SecretValue`, `SecretRef`,
  `Sandbox`, `EvalScorer`. Every `SecretValue` implementation is required
  to expose the four leakage barriers `Symbol.toPrimitive`, `toJSON`,
  `[Symbol.for('nodejs.util.inspect.custom')]`, and the cross-realm
  brand `Symbol.for('graphorin.SecretValue')`.
- The workflow primitive set under `@graphorin/core/channels`:
  `Directive`, `Dispatch`, `pause`, `LatestValue`, `Reducer`, `Stream`,
  `Barrier`, `Ephemeral`, `AnyValue`, `ListAggregate`. Names are part
  of the public API.
- A small, dependency-free utility surface under
  `@graphorin/core/utils`: `collect`, `mapStream`, `merge`, `withSignal`,
  `filter`, `take`, `takeWhile`, `assertNever`, `md5`, `xxhash`,
  `createAsyncContext`, `validate`, `validateOrThrow`. Every stream
  helper is covered by an explicit `AbortSignal` propagation test.
- Stop-condition combinators: `isStepCount`, `hasToolCall`, `isTerminal`,
  `or`, `and`, `not`.

The package declares `zod` as a peer dependency (`^3.23 || ^4`); it has
no other runtime dependencies and no internal dependencies on any other
`@graphorin/*` package.
