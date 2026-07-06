[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / GraphorinServer

# Interface: GraphorinServer

Defined in: packages/server/src/app.ts:57

Public surface returned by [createServer](/api/@graphorin/server/functions/createServer.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-agents"></a> `agents` | `readonly` | [`AgentRegistry`](/api/@graphorin/server/registry/classes/AgentRegistry.md) | - | packages/server/src/app.ts:61 |
| <a id="property-app"></a> `app` | `readonly` | `Hono`\<\{ `Variables`: [`ServerVariables`](/api/@graphorin/server/interfaces/ServerVariables.md); \}\> | - | packages/server/src/app.ts:60 |
| <a id="property-config"></a> `config` | `readonly` | [`ServerConfigSpec`](/api/@graphorin/server/config/interfaces/ServerConfigSpec.md) | - | packages/server/src/app.ts:59 |
| <a id="property-consolidator"></a> `consolidator` | `readonly` | \| [`ConsolidatorDaemon`](/api/@graphorin/server/interfaces/ConsolidatorDaemon.md) \| `undefined` | Optional consolidator daemon - populated when the operator supplied a `Consolidator` instance via `createServer({ consolidator })`. Phase 14c integration. | packages/server/src/app.ts:89 |
| <a id="property-listeningon"></a> `listeningOn` | `readonly` | \| \{ `host`: `string`; `port`: `number`; \} \| `undefined` | - | packages/server/src/app.ts:64 |
| <a id="property-metrics"></a> `metrics` | `readonly` | [`MetricRegistry`](/api/@graphorin/server/classes/MetricRegistry.md) | Phase 14c Prometheus registry. Always present; sample updates are observable via `metrics.snapshot()`. | packages/server/src/app.ts:99 |
| <a id="property-runs"></a> `runs` | `readonly` | [`RunStateTracker`](/api/@graphorin/server/classes/RunStateTracker.md) | - | packages/server/src/app.ts:63 |
| <a id="property-triggers"></a> `triggers` | `readonly` | \| [`TriggersDaemon`](/api/@graphorin/server/interfaces/TriggersDaemon.md) \| `undefined` | Optional triggers daemon - populated when the operator wired a scheduler (or an in-process trigger surface) at construction time. Phase 14c integration. | packages/server/src/app.ts:83 |
| <a id="property-version"></a> `version` | `readonly` | `string` | - | packages/server/src/app.ts:58 |
| <a id="property-workflows"></a> `workflows` | `readonly` | [`WorkflowRegistry`](/api/@graphorin/server/registry/classes/WorkflowRegistry.md) | - | packages/server/src/app.ts:62 |
| <a id="property-workflowtimers"></a> `workflowTimers` | `readonly` | \| [`WorkflowTimerDaemon`](/api/@graphorin/server/interfaces/WorkflowTimerDaemon.md) \| `undefined` | W-032: optional workflow durable-timer daemon - populated when the operator wired a `createTimerDriver(...)` at construction time. | packages/server/src/app.ts:94 |
| <a id="property-wsdispatcher"></a> `wsDispatcher` | `readonly` | \| [`WsDispatcher`](/api/@graphorin/server/interfaces/WsDispatcher.md) \| `undefined` | Optional WebSocket dispatcher exposed when `server.ws.enabled = true`. Route handlers + the agent / workflow runtimes call `dispatcher.emit(subject, event)` to fan out events to subscribed clients. Returns `undefined` when WS is disabled. | packages/server/src/app.ts:71 |
| <a id="property-wstickets"></a> `wsTickets` | `readonly` | \| [`WsTicketStore`](/api/@graphorin/server/interfaces/WsTicketStore.md) \| `undefined` | Optional WebSocket ticket store exposed when `server.ws.enabled = true`. Surfaced primarily for tests; the `POST /v1/session/ws-ticket` route uses it transparently. | packages/server/src/app.ts:77 |

## Methods

### start()

```ts
start(): Promise<{
  host: string;
  port: number;
}>;
```

Defined in: packages/server/src/app.ts:100

#### Returns

`Promise`\<\{
  `host`: `string`;
  `port`: `number`;
\}\>

***

### stop()

```ts
stop(options?): Promise<void>;
```

Defined in: packages/server/src/app.ts:101

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options?` | \{ `force?`: `boolean`; \} |
| `options.force?` | `boolean` |

#### Returns

`Promise`\<`void`\>
