[**Graphorin API reference v0.8.0**](../../index.md)

***

[Graphorin API reference](/api/index.md) / @graphorin/server

# @graphorin/server

> Standalone server runtime for the [Graphorin](https://github.com/o-stepper/graphorin) framework.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/o-stepper/graphorin/blob/main/LICENSE)
[![Node.js: 22+](https://img.shields.io/badge/Node.js-22%2B-43853d.svg)](https://nodejs.org)

- **Version:** v0.8.0
- **License:** [MIT](https://github.com/o-stepper/graphorin/blob/main/LICENSE) (© 2026 Oleksiy Stepurenko)
- **Repository:** <https://github.com/o-stepper/graphorin/tree/main/packages/server>
- **Issues:** <https://github.com/o-stepper/graphorin/issues>

## What ships in v0.1 (Phases 14a + 14b + 14c)

`@graphorin/server` is the optional, first-class server runtime. Phase 14 is feature-complete: it ships the full HTTP surface, the lifecycle plumbing, the auth + scope + idempotency + audit middleware stack, the programmatic `createServer({...})` factory consumed by the `graphorin start` CLI binary in [`@graphorin/cli`](/api/@graphorin/cli/index.md), the `graphorin.protocol.v1` WebSocket transport with single-use ticket flow + per-subject replay buffer + delivery-layer commentary-phase trace sanitization, the Server-Sent-Events fallback for proxy-restricted clients, the durable triggers + consolidator daemon integration, the per-subsystem health rollup + `/v1/health/secrets` admin endpoint, the Prometheus `/v1/metrics` exposition, and the scope-enforced replay + audit verification endpoints.

| Capability | Detail |
|---|---|
| **HTTP server** | Built on [`hono@^4.12.0`](https://hono.dev/) and [`@hono/node-server@^1.19.0`](https://github.com/honojs/node-server). |
| **WebSocket** | Built on [`@hono/node-ws@^1.3.0`](https://github.com/honojs/middleware/tree/main/packages/node-ws); subprotocol `graphorin.protocol.v1`; bearer + ticket auth; per-subject replay buffer (default 1000 events / 5 min TTL); delivery-layer commentary-phase trace sanitization. Schemas live in [`@graphorin/protocol`](/api/@graphorin/protocol/index.md). |
| **SSE fallback** | `GET /v1/sessions/:id/events` for non-WebSocket-friendly clients (corporate proxies, restricted networks). Same sanitization, same `Last-Event-ID` resume semantics. |
| **Lifecycle hooks** | `beforeStart` → pre-bind validation → storage migrations → bind → triggers / consolidator daemons start → `onReady`; `SIGTERM` → `beforeShutdown` → daemons stop → drain → exit. |
| **Pre-bind validation** | Resolves every `*Ref` field via `@graphorin/security` resolvers before binding the listener; missing pepper / unresolvable `SecretRef` / missing encryption peer fail fast with typed errors. |
| **REST endpoints** | Agents (`run`, `stream`, `state`, `abort`, `resume`), workflows (`execute`, `resume`, `state`, `checkpoints`; `fork` answers an honest `501` until thread forking lands on the REST surface), sessions, memory, skills, MCP, tokens, audit (`list`, `export`, `verify`), the `POST /v1/session/ws-ticket` browser ticket route, triggers (`list`, `get`, `fire`, `disable`, `prune`), replay (`runs/:runId/replay`, `sessions/:id/replay`), `/health`, `/health/secrets`, `/metrics`. Every side-effecting endpoint honours an `Idempotency-Key` per IETF draft-07. |
| **Auth / scope** | `Authorization: Bearer gph_<env>_v1_<...>` (HMAC-SHA256 + pepper) wired through `TokenVerifier` from `@graphorin/security`. Per-route scope grammar `<resource>:<action>[:<id>]`. WebSocket upgrade honours both bearer and the single-use ticket flow. |
| **Idempotency** | SQLite-backed `idempotency_records` + LRU read cache. Replays cached responses with `Idempotency-Replayed: true`; mismatched payloads return `409`, and a concurrent duplicate of an in-flight key gets `409 idempotency-in-flight` with a `Retry-After` hint. |
| **CORS / CSRF / rate limit** | Deny-by-default CORS; double-submit CSRF for browser flows; sliding-window per-IP rate limit. |
| **Audit middleware** | Forwards every authenticated request through `appendAudit` (`@graphorin/security/audit`) with attribution, route, status, and duration. `POST /v1/audit/verify` walks the SHA-256 hash chain and surfaces the integrity status. |
| **Triggers daemon** | Wraps `@graphorin/triggers` `Scheduler`; `beforeStart` loads every persisted `trigger_state` row + applies the per-trigger `catchupPolicy`; `beforeShutdown` stops the scheduler. Cron / interval / idle / event triggers survive process restarts. |
| **Consolidator daemon** | Lifecycle adapter for the `@graphorin/memory` consolidator runtime. Hard 10-second stop timeout so the daemon never hangs on a stuck phase. |
| **Health rollup** | `/v1/health` returns `{ status, version, uptimeSeconds, checks: { storage, embedder, secrets, encryption, consolidator, triggers, replayBuffer } }`. HTTP 200 on `'degraded'` (warn); HTTP 503 on `'failing'`. |
| **Secrets health** | `/v1/health/secrets` (scope `secrets:read`) returns the active store + fallback chain + downgrade reason per the secrets capability matrix. |
| **Prometheus metrics** | `/v1/metrics` text exposition v0.0.4 with `graphorin_*` prefix discipline. The canonical inventory covers agent runs, tool calls, provider tokens / cost, WAL size, idempotency hit ratio, trigger fires, redaction drops, consolidator queue depth / DLQ / budget, OAuth token freshness, replay buffer size, in-flight runs, server uptime, and a static `graphorin_build_info` gauge. |
| **Replay endpoints** | `POST /v1/runs/:runId/replay` and `POST /v1/sessions/:id/replay` enforce `traces:read:sanitized` (default) or `traces:read:raw` (admin); every invocation appends an audit chain entry. |
| **Graceful shutdown** | Drains in-flight runs within the configured timeout (default 30 s), preserves run state via `RunStateTracker`, propagates `AbortSignal` cancellation to handlers, tears down WebSocket subscriptions cleanly. |
| **No phone home** | Zero implicit network calls - verified by the repository-wide `pnpm run check-no-network` CI check. |

## Out of scope for Phase 14

- Multi-tenant runtime - **v0.3+**.
- OpenTelemetry metrics export (in addition to Prometheus) - post-MVP.

## Install

```bash
pnpm add @graphorin/server @graphorin/security @graphorin/store-sqlite \
  @graphorin/protocol @graphorin/triggers hono @hono/node-server @hono/node-ws
```

> Other npm-registry-compatible package managers (`npm`, `yarn`, `bun`) work identically; the project itself is developed with [pnpm](https://pnpm.io/).

## Programmatic usage

```ts
import { createServer, defineConfig } from '@graphorin/server';

const server = await createServer({
  config: defineConfig({
    server: { host: '127.0.0.1', port: 8080 },
    auth: { kind: 'token', pepperRef: 'keyring:graphorin_server_pepper' },
    storage: { path: './.graphorin/data.db', mode: 'server' },
  }),
});

server.agents.register({
  id: 'echo',
  description: 'Echoes its input back to the caller.',
  agent: {
    id: 'echo',
    async run(input) {
      return { input };
    },
  },
});

const { host, port } = await server.start();
console.error(`graphorin listening on http://${host}:${port}/v1`);
```

## CLI

The `graphorin start` / `graphorin init` / `graphorin migrate` CLI ships from [`@graphorin/cli`](/api/@graphorin/cli/index.md).

## Configuration

Every field in `defineConfig({...})` is optional and falls back to a documented production-ready default. The full schema (Zod) is exported as `ServerConfigSchema` from `@graphorin/server/config` so operators can compose validation pipelines on top of the framework.

The most-frequently-touched options:

| Field | Default | Notes |
|---|---|---|
| `server.host` | `127.0.0.1` | Bind to `0.0.0.0` only behind a reverse proxy. |
| `server.port` | `8080` | |
| `server.basePath` | `/v1` | |
| `server.idempotency.requireKey` | `'warn'` | `'enforce'` is opt-in for production. |
| `server.idempotency.ttlSeconds` | `86400` | 24 hours. |
| `server.cors.allowOrigins` | `[]` | Deny by default; pass an explicit allowlist (or `['*']`). |
| `server.csrf.enabled` | `true` | Bearer-token requests are exempt. |
| `server.rateLimit.perIpRequests` | `60` | Per minute. |
| `server.shutdown.drainTimeoutMs` | `30000` | |
| `auth.kind` | `'token'` | Set to `'none'` only for trusted loopback environments. |
| `auth.pepperRef` | _(required for token auth)_ | A `SecretRef` pointing at the HMAC pepper. |
| `storage.path` | `'./.graphorin/data.db'` | |
| `storage.encryption.enabled` | `false` | Opt-in SQLCipher v4 via the `better-sqlite3-multiple-ciphers` peer. |
| `audit.enabled` | `false` | Opt-in mandatory-encrypted audit log per DEC-124. |
| `metrics.enabled` | `true` | Mounts `/v1/metrics` for Prometheus scraping. |
| `metrics.requireAuth` | `false` | Opt into the `admin:metrics:read` scope for stricter deployments. |
| `health.walWarnThresholdBytes` | `52428800` | 50 MB; storage check flips to `'warn'` above this. |

## Status

`@graphorin/server` is part of the Graphorin framework's `v0.8.0` pre-release. Once published, the package follows the lockstep release cadence shared by every `@graphorin/*` package on the `0.x` line.

---

**Project Graphorin** · v0.8.0 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>

## Modules

| Module | Description |
| ------ | ------ |
| [](/api/@graphorin/server/README.md) | `@graphorin/server` - standalone server runtime for the Graphorin framework. |
| [commentary](/api/@graphorin/server/commentary/index.md) | Delivery-layer commentary-phase trace sanitization for `@graphorin/server`. |
| [config](/api/@graphorin/server/config/index.md) | Strongly-typed configuration loader for the Graphorin server. |
| [consolidator](/api/@graphorin/server/consolidator/index.md) | `@graphorin/server/consolidator` - Phase 14c lifecycle adapter for the consolidator runtime. |
| [errors](/api/@graphorin/server/errors/index.md) | Typed error surface for `@graphorin/server`. Every server-side configuration / lifecycle / runtime failure that an operator must be able to reason about flows through one of the classes in this module so it carries a stable `kind` discriminator + `hint` field pointing the operator at the next remediation step. |
| [health](/api/@graphorin/server/health/index.md) | `@graphorin/server/health` - Phase 14c health + Prometheus metrics surface. Phase 14a's `/v1/health` is superseded by the extended routes built here when consumers wire the additional probes. |
| [metrics](/api/@graphorin/server/metrics/index.md) | `@graphorin/server/metrics` - Phase 14c Prometheus exposition layer. |
| [middleware](/api/@graphorin/server/middleware/index.md) | Middleware barrel for `@graphorin/server`. Every entry is a Hono `MiddlewareHandler`; they are composed by the `createServer({...})` factory in a fixed order: |
| [package.json](/api/@graphorin/server/package.json/index.md) | - |
| [registry](/api/@graphorin/server/registry/index.md) | Registry plumbing that lets the server route handlers locate user- defined agents, workflows, sessions, memory, skills, and MCP server bindings without taking a hard peer dependency on every sibling package. |
| [replay](/api/@graphorin/server/replay/index.md) | `@graphorin/server/replay` - Phase 14c scope-enforced replay endpoints + audit integration. |
| [sse](/api/@graphorin/server/sse/index.md) | Server-Sent Events fallback transport for `@graphorin/server`. |
| [triggers](/api/@graphorin/server/triggers/index.md) | `@graphorin/server/triggers` - daemon + REST routes for the triggers scheduler. Phase 14c surface. |
| [ws](/api/@graphorin/server/ws/index.md) | `@graphorin/server/ws` - WebSocket protocol implementation for the Graphorin standalone server. Combines the dispatcher (which fans events out to subscribers + applies the delivery-layer commentary sanitization), the in-memory ticket store (browser single-use ticket flow), the per-subject replay buffer, the strict subject grammar parser + scope check, and the `@hono/node-ws` upgrade handler. |
