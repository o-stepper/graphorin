# @graphorin/channels

## 0.13.4

### Patch Changes

- Updated dependencies []:
  - @graphorin/tools@0.13.4
  - @graphorin/core@0.13.4

## 0.13.3

### Patch Changes

- Updated dependencies []:
  - @graphorin/tools@0.13.3
  - @graphorin/core@0.13.3

## 0.13.2

### Patch Changes

- Updated dependencies [[`bba9048`](https://github.com/o-stepper/graphorin/commit/bba9048043fe97ce623079700f0e93b4b7705425)]:
  - @graphorin/core@0.13.2
  - @graphorin/tools@0.13.2

## 0.13.1

### Patch Changes

- Updated dependencies [[`7991726`](https://github.com/o-stepper/graphorin/commit/7991726fbd06426bdfb1e9c1a5c1e4bd5466d0f4)]:
  - @graphorin/core@0.13.1
  - @graphorin/tools@0.13.1

## 0.13.0

### Patch Changes

- Updated dependencies []:
  - @graphorin/tools@0.13.0
  - @graphorin/core@0.13.0

## 0.12.1

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.12.1
  - @graphorin/tools@0.12.1

## 0.12.0

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.12.0
  - @graphorin/tools@0.12.0

## 0.11.0

### Patch Changes

- Updated dependencies [[`47b6034`](https://github.com/o-stepper/graphorin/commit/47b60342dc8a345d1299a22a2fc4fe2aac50bb31)]:
  - @graphorin/core@0.11.0
  - @graphorin/tools@0.11.0

## 0.10.2

### Patch Changes

- Updated dependencies [[`42cff94`](https://github.com/o-stepper/graphorin/commit/42cff94a6a3636e3ebe80d22b2b83a428afc727f)]:
  - @graphorin/tools@0.10.2
  - @graphorin/core@0.10.2

## 0.10.1

### Patch Changes

- Updated dependencies [[`79ef389`](https://github.com/o-stepper/graphorin/commit/79ef3894c409c0a6b9d31fac9b6c888d4068d4e7), [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a), [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a), [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a)]:
  - @graphorin/core@0.10.1
  - @graphorin/tools@0.10.1

## 0.10.0

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.10.0
  - @graphorin/tools@0.10.0

## 0.9.0

### Minor Changes

- [#171](https://github.com/o-stepper/graphorin/pull/171) [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041) Thanks [@o-stepper](https://github.com/o-stepper)! - New package `@graphorin/channels` - the messenger front door (bot-adoption wave B, item 1). The vendor-neutral adapter SPI (`ChannelAdapter`, `InboundChannelMessage`, the `ChannelIdentity` triple, `ChannelCapabilities`, `DeliveryPayload` with the optional `question` HITL placeholder, typed fire-and-forget `ChannelDeliveryError`); a deterministic identity router (ordered route table, first-match-wins, mandatory catch-all, stable per-peer `defaultSessionKey`; sessionKey is a routing selector, never an authz token); the access policy (`pairing` default with one-time TTL codes and a per-channel pending cap, `allowlist`, `open`, `disabled`) over the new `PairingStore` contract in `@graphorin/core/contracts` (sqlite implementation behind migration 034, exposed as `createSqliteStore(...).pairing`); the gateway runtime (bounded per-adapter queues with shed-on-overflow, access check before any routing or model spend, inbound sanitisation + ready-made `inboundTaint` seed, reply/proactive delivery through the shared outbound catalogue with channel-default `'strip'`); and `@graphorin/channels/testkit` (loopback adapter, in-memory pairing store, framework-agnostic adapter conformance suite). Core also gains the canonical `SttAdapter` contract whose transcripts pin `trustClass: 'channel-inbound'`. The server hosts the gateway structurally (`createServer({ channels })`, new `@graphorin/server/channels` subpath): started last / stopped first in the lifecycle, aggregated into `/v1/health`, and bridged so accepted inbound messages call `scheduler.recordActivity()`. No vendor adapters ship with the framework.

- [#171](https://github.com/o-stepper/graphorin/pull/171) [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041) Thanks [@o-stepper](https://github.com/o-stepper)! - Assistant output as a data-flow sink + pluggable injection classifier (bot-adoption wave B, B4 / item 14). `DataFlowEvaluation` gains `sinkKind` (`'tool' | 'assistant-output'`; `isSink` honors it) and the agent guard gains `inspectAssistantOutput`: the run's outgoing text is evaluated as a sink with the stable id `'assistant-output'` in the commit path - enforce-mode blocks replace the durable message with a fixed notice and withhold the run's final output (unified with the lateral-leak path), shadow flags, and `declassifySinks: ['assistant-output']` re-opens the reply surface deliberately; findings land in the B3 verdict sidecar. New `@graphorin/security/inspect` subpath ships the `InjectionClassifier` seam (D-12): the resilient `runInjectionClassifier` (engine errors always degrade to the regex verdict) plus the `injectionClassifierOutputGuardrail` adapter, wired at all three regex layers - inbound sanitisation (`applyInboundSanitizationWithClassifier` in `@graphorin/tools/inbound`, exposed on the channel gateway as `injectionClassifier`), SDF-4 output guardrails, and the memory write-time quarantine gate (`createMemory({ injectionClassifier })`, widen-only). Offline default off everywhere; the framework ships no engine. W-103 stays warn + opt-in per D-13, with `treatPiiAsSensitive: true` recommended in the documented gateway preset.

### Patch Changes

- Updated dependencies [[`24241a3`](https://github.com/o-stepper/graphorin/commit/24241a3cdb9c684338f02d4d66510c248eb47d7e), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`da7952b`](https://github.com/o-stepper/graphorin/commit/da7952b6b543958838aee8bfab249d24d1061a69), [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160), [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160), [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160), [`9b389be`](https://github.com/o-stepper/graphorin/commit/9b389be2ac436f66d62b3ede9c64cd70808cfe9f), [`9b389be`](https://github.com/o-stepper/graphorin/commit/9b389be2ac436f66d62b3ede9c64cd70808cfe9f)]:
  - @graphorin/core@0.9.0
  - @graphorin/tools@0.9.0
