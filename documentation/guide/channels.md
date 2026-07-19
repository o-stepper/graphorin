---
title: Channels
description: The messenger front door - vendor-neutral ChannelAdapter SPI, identity routing, pairing access policy, the trust boundary (inbound sanitisation + taint), the gateway runtime, and the adapter testkit.
---

# Channels

`@graphorin/channels` is the front door between a messenger (Telegram, Slack, e-mail, a CLI pipe) and a Graphorin agent. The framework ships the mechanism; applications ship the policy: the package contains **no vendor adapters** - an adapter lives in the application repository and is developed against the bundled testkit.

The package owns five things:

- **The adapter SPI** - `ChannelAdapter`, `InboundChannelMessage`, `ChannelIdentity`, `ChannelCapabilities`, `DeliveryPayload`.
- **The identity router** - a deterministic route table `(channelId, accountId, peerId) -> { sessionKey, agentId }`.
- **The access policy** - `pairing` (default), `allowlist`, `open`, `disabled`, with `PairingStore`-backed one-time codes.
- **The gateway runtime** - bounded inbound queues, the trust boundary (sanitisation + taint seed), routing, reply delivery with outbound scaffolding sanitisation.
- **The testkit** - an in-memory loopback adapter plus a conformance suite third-party adapters run in their own CI.

Naming note: the workflow state-merge primitives exported from `@graphorin/core/channels` (`LatestValue`, `Reducer`, ...) are an unrelated concept; this package deliberately exports no symbol named `Channel` or `ChannelKind`.

## The identity triple

Every inbound message carries a `ChannelIdentity` triple: `channelId` (the adapter instance), `accountId` (the bot account on that channel), `peerId` (the remote user/chat). Two invariants:

- The triple is a **routing selector, never an authorization token**. Peers assert their own identity through the vendor transport; WHO may talk is decided by the access policy, WHERE the conversation lands is decided by the router - in that order.
- When a route row omits `sessionKey`, the router derives the stable per-peer key `<channelId>:<accountId>:<peerId>` (exported as `defaultSessionKey`), so two peers never share a session by accident. Set `sessionKey` explicitly to pool conversations on purpose.

## Routing

The route table is data, not code: ordered rows, first match wins, and a catch-all default row (no identity constraints) is mandatory - `createIdentityRouter` throws without one, so routing is total by construction.

```ts no-check
import { createIdentityRouter } from '@graphorin/channels';

const router = createIdentityRouter({
  routes: [
    // The owner's private chat goes to the full assistant.
    { channelId: 'telegram', peerId: '188432012', agentId: 'assistant' },
    // Everyone else on telegram gets the restricted persona.
    { channelId: 'telegram', agentId: 'public-persona' },
    // Mandatory catch-all.
    { agentId: 'public-persona' },
  ],
});
```

## Access policy and pairing

`createAccessController` evaluates WHO may talk before any routing, sanitisation, or model spend. Four deterministic policies: `pairing` (default), `allowlist`, `open`, `disabled`.

Pairing flow: an unknown peer's first message creates a short-lived one-time code (TTL 1 hour, pending cap 3 per channel by default); the operator approves it out-of-band (`controller.approve(channelId, code)` behind your CLI or REST wiring); the peer becomes durably paired. Persistence goes through the `PairingStore` contract in `@graphorin/core/contracts` - `createSqliteStore(...).pairing` is the default implementation (migration 034), and the testkit ships an in-memory one.

```ts no-check
import { createAccessController } from '@graphorin/channels';
import { createSqliteStore } from '@graphorin/store-sqlite';

const store = await createSqliteStore({ path: './assistant.sqlite' });
await store.init();

const access = createAccessController({
  policy: { kind: 'pairing', pairing: { ttlMs: 60 * 60 * 1000, maxPendingPerChannel: 3 } },
  store: store.pairing,
});
```

The framework never texts a peer on its own: when a check ends in a pairing challenge or a denial, the gateway calls your `onUnauthorized` callback - the wording (and whether to answer at all) is application policy.

## The trust boundary

Channel peers are authenticated by the pairing policy, but their CONTENT is still attacker-influenceable (forwarded posts, quoted articles, pasted text). The gateway therefore treats every inbound body as untrusted:

1. **Inbound sanitisation** - `sanitizeChannelInbound` pins `applyInboundSanitization` from `@graphorin/tools/inbound` to the `'channel-inbound'` trust class: imperative injection patterns are stripped, chat-template tokens are neutralized, and the remainder is wrapped in the untrusted-content envelope. The handler receives `sanitizedText`; the original stays on `message.text` for audit and taint seeding only. Note `sanitizedText` is **not** tidy plain text - it is the cleaned body still inside the boundary envelope:

   ```text
   <<<untrusted_content trust="channel-inbound" tool="channel:<id>" origin="channel:<id>">>>
   <cleaned body>
   <<</untrusted_content>>>
   ```

   That is exactly what the model should see (the envelope IS the trust boundary); pass it to the run as-is, and do not log or display it expecting bare text.
2. **Taint seed** - the handler context carries a ready-made `inboundTaint` object. Pass it to the run (`agent.run(ctx.sanitizedText, { inboundTaint: ctx.inboundTaint })`) and the run's data-flow ledger is armed BEFORE the first step: the new `'channel-inbound'` trust class is registered in the same `isUntrustedTrustClass` source the taint engine and the Rule-of-Two consume, so both layers agree that channel input arms the untrusted leg even though it arrives as a user message rather than a tool output. **The seed only arms if the agent has a `dataFlowPolicy`** - the gateway hands you `inboundTaint` unconditionally, but `agent.run(...)` treats it as a no-op when the agent config carries no data-flow policy, so wiring the plumbing without the policy gives you an UNARMED run that looks armed. Configure both halves (see the snippet below).
3. **Outbound scaffolding sanitisation** - every `deliver()` (replies and proactive sends alike) runs through the shared outbound commentary catalogue from `@graphorin/tools/outbound`. The channel default policy is `'strip'`: matched fragments - including a `<<<commentary>>>` fragment an upstream boundary already wrapped - are removed entirely, because a messenger peer has no UI that could collapse the envelope. The catalogue is the same single source the server delivery layer and the session-output boundary consume, so tool-call payloads can never leak on one surface while being scrubbed on another. Scope honestly: the strip catalogue targets the **commentary envelope only**. The inbound `<<<untrusted_content>>>` envelope is model-visible context by design and is NOT stripped outbound - a handler (or scripted provider) that echoes its input verbatim will deliver the envelope markers to the peer, so never echo `sanitizedText` back as a reply.
4. **Optional injection classifier** - `injectionClassifier` on the gateway consults a pluggable classifier (see [Security](/guide/security)) after the regex pass; flagged verdicts land in `sanitization.patternsHit` as `classifier:<id>`. Default off; classifier errors never break the pipeline.

## The gateway

```ts no-check
import {
  createAccessController,
  createChannelGateway,
  createIdentityRouter,
} from '@graphorin/channels';

const gateway = createChannelGateway({
  adapters: [myTelegramAdapter],
  router,
  access,
  queueLimit: 64, // bounded per-adapter queue; overflow sheds with a WARN
  onUnauthorized: async (message, decision, io) => {
    if (decision.kind === 'pairing-challenge' && decision.issued) {
      await io.deliver({ text: `Pairing code: ${decision.code}` });
    }
  },
  onMessage: async (ctx) => {
    // The taint seed arms only because the agent was created WITH a
    // dataFlowPolicy - without one, inboundTaint is a silent no-op:
    //   createAgent({ ..., dataFlowPolicy: { mode: 'enforce' } })
    const result = await agent.run(ctx.sanitizedText, {
      sessionId: ctx.route.sessionKey,
      inboundTaint: ctx.inboundTaint,
    });
    return { text: result.output };
  },
});

await gateway.start();
```

Pipeline per message: bounded queue (shed on overflow, typed `queue-full` acceptance back to the adapter) -> access policy -> inbound sanitisation + taint seed -> routing -> your handler -> reply delivery with outbound sanitisation. Handler errors are contained (counted + warned), never fatal to the gateway. `await gateway.status()` (async - it returns a `Promise`) exposes per-channel counters (`queued`, `dropped`, `processed`, `denied`, `failed`, `delivered`, `deliveryFailures`).

Delivery is fire-and-forget by design: the adapter owns bounded in-call retries and throws the typed `ChannelDeliveryError` (with a `retryable` hint) when they are exhausted. There is no durable outbox in the framework.

The optional `question` field on `DeliveryPayload` is the HITL surface placeholder: `{ prompt, options[], ref }`, where `ref` is an opaque resolve reference - a serialized workflow awakeable address (`serializeAwakeableRef` from `@graphorin/workflow`) or an agent approval id. Rendering (buttons, quick replies, plain text) is the adapter's choice; the full escalation ladder is documented in the [proactivity guide](/guide/proactivity).

## Running under the server

`@graphorin/server` hosts the gateway as a managed daemon through structural typing - it never imports the channels package:

```ts no-check
import { createServer } from '@graphorin/server';

const server = await createServer({
  store,
  channels: { gateway },
});
await server.start();
```

The lifecycle starts the gateway LAST (inbound only begins once every downstream daemon is live) and stops it FIRST (the front door closes before shutdown drains). `/v1/health` gains a `channels` check (running / channels / queued / dropped / failed; a stopped gateway degrades, a failing `status()` fails). When a triggers scheduler is also wired, every ACCEPTED inbound message calls `Scheduler.recordActivity()`, so `idle:T` triggers debounce on channel traffic exactly like tracked runs.

## Voice notes

The speech-to-text seam is the `SttAdapter` contract in `@graphorin/core/contracts` - one canonical definition shared by this package and any future voice pipeline. `SttTranscript.trustClass` is pinned to `'channel-inbound'` at the type level: a transcript of a voice note is message-borne channel content and always inherits the channel trust boundary, no matter which engine produced it. The framework ships no engines.

## Testkit

`@graphorin/channels/testkit` is the adapter author's surface:

- `createLoopbackAdapter()` - a full in-memory adapter (`inject()` inbound, read `deliveries`, `failNextDeliver()`), used by this repository's own acceptance e2e.
- `createInMemoryPairingStore()` - the `PairingStore` contract without SQLite.
- `describeChannelAdapterConformance(api, harness)` - the executable SPI contract: lifecycle idempotence, inbound normalization, acceptance-verdict propagation, delivery receipts, typed delivery errors. Run it in the adapter repository's own test suite:

```ts no-check
import { describe, expect, it } from 'vitest';
import { describeChannelAdapterConformance } from '@graphorin/channels/testkit';

describeChannelAdapterConformance(
  { describe, it, expect },
  {
    makeAdapter: () => createMyTelegramAdapter({ token: 'test' }),
    sendInbound: (adapter, text) => myVendorFake.emitMessage(adapter, text),
  },
);
```

## Recommended gateway security preset

The trust boundary above is mechanism; this is the recommended POLICY for a personal-assistant gateway (start in shadow, move to enforce):

```ts no-check
import { verdictIngestGate } from '@graphorin/memory';

const agent = createAgent({
  name: 'assistant',
  provider,
  memory,
  dataFlowPolicy: {
    mode: 'shadow', // observe first; switch to 'enforce' after reviewing flags
    treatPiiAsSensitive: true, // PII arms the sensitive leg by content
    derivedTaint: 'strict', // paraphrase-robust once channel input arrived
    // declassifySinks: ['assistant-output'], // only after reviewing enforce-mode blocks
  },
});

const memory = createMemory({
  store,
  ingestGate: verdictIngestGate, // guardrail-blocked turns never become memories
});
```

Notes on the preset:

- `'channel-inbound'` is untrusted by construction - you do not configure that; passing `ctx.inboundTaint` into every run is what arms it.
- In `enforce` mode the final assistant reply is itself a sink (stable id `'assistant-output'`): on a lethal-trifecta run the reply is withheld and replaced by a notice unless you explicitly declassify the reply surface. See [Security](/guide/security).
- `treatPiiAsSensitive` stays opt-in framework-wide: the recommendation here is preset policy, not a framework default.
- Memory hygiene: pair the gateway with `ingestGate: verdictIngestGate` so blocked turns cannot become long-term memories - the write path is gated by persisted verdicts, not by trust in the conversation loop.

## Composing the full bot

There is no single `createBot(...)` entry point yet - a real assistant composes five subsystems, each documented in its own guide, and the seams have three easy-to-miss couplings called out above: `gateway.status()` is async, `inboundTaint` arms only next to an agent-level `dataFlowPolicy`, and the scheduler's interval floor rejects dev-speed heartbeats unless the harness lowers it. The wiring order that works:

1. one `createSqliteStore` + `createMemory` (with `ingestGate`) shared by everything;
2. the agent (`createAgent` with `memory`, `tools`, `dataFlowPolicy`, guardrails);
3. the channel gateway from this guide, passing `ctx.inboundTaint` into every run;
4. proactivity (heartbeat / cron tasks) against the same agent and store - see [Proactivity](/guide/proactivity);
5. optionally the [standalone server](/guide/standalone-server) to host all of it behind one lifecycle.

The runnable [example apps](/guide/examples) cover each subsystem in isolation; `personal-assistant-cli` is the closest end-to-end composition today.
