[**Graphorin API reference v0.13.7**](../../index.md)

***

[Graphorin API reference](/api/index.md) / @graphorin/channels

# @graphorin/channels

> Channel SPI + gateway runtime: the messenger front door for Graphorin agents, without a single vendor adapter.

`@graphorin/channels` defines the vendor-neutral contract between a messenger (Telegram, Slack, e-mail, a CLI pipe) and a Graphorin agent, plus the runtime that sits between them. Vendor adapters live in application repositories and are developed against the bundled testkit; the framework ships the mechanism, applications ship the policy and the credentials.

The package owns:

- The adapter SPI: `ChannelAdapter`, `InboundChannelMessage`, `ChannelIdentity`, `ChannelCapabilities`, `DeliveryPayload`.
- The deterministic identity router: `(channelId, accountId, peerId) -> { sessionKey, agentId }`.
- The access policy (`pairing` by default) and the `PairingStore`-backed pairing codes.
- The gateway runtime: bounded inbound queues, inbound sanitization + taint labeling, outbound scaffolding sanitization on every `deliver()`.
- `@graphorin/channels/testkit`: an in-memory loopback adapter and a conformance suite for third-party adapters.

Naming note: the workflow state-merge primitives exported from `@graphorin/core/channels` (`LatestValue`, `Reducer`, ...) are an unrelated concept. This package deliberately exports no symbol named `Channel` or `ChannelKind`.

## Install

```bash
pnpm add @graphorin/channels
```

## Quick start

```ts no-check
import { createChannelGateway, createIdentityRouter } from '@graphorin/channels';
import { loopbackAdapter } from '@graphorin/channels/testkit';

const router = createIdentityRouter({
  routes: [{ agentId: 'assistant' }],
});

const gateway = createChannelGateway({
  adapters: [loopbackAdapter()],
  router,
  accessPolicy: { kind: 'open' },
  onMessage: async ({ text, route }) => {
    // run your agent for route.sessionKey / route.agentId and reply
    return { text: `echo: ${text}` };
  },
});

await gateway.start();
```

See the guide page for the full trust-boundary story (inbound sanitization, `channel-inbound` taint, pairing) and the recommended gateway security preset.

## License

MIT © 2026 Oleksiy Stepurenko.

---

**Project Graphorin** · v0.13.7 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>

## Modules

| Module | Description |
| ------ | ------ |
| [](/api/@graphorin/channels/README.md) | @graphorin/channels - vendor-neutral channel SPI and gateway runtime for messenger front doors. |
| [package.json](/api/@graphorin/channels/package.json/index.md) | - |
| [testkit](/api/@graphorin/channels/testkit/index.md) | `@graphorin/channels/testkit` - conformance suite + in-memory building blocks for adapter authors and application tests. |
