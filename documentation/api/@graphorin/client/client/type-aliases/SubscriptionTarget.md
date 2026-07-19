[**Graphorin API reference v0.13.2**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/client](/api/@graphorin/client/index.md) / [client](/api/@graphorin/client/client/index.md) / SubscriptionTarget

# Type Alias: SubscriptionTarget

```ts
type SubscriptionTarget = 
  | {
  id: string;
  target: "session";
}
  | {
  id: string;
  runId: string;
  target: "agent";
}
  | {
  runId: string;
  sessionId?: string;
  target: "run";
}
  | {
  id: string;
  runId?: string;
  target: "workflow";
};
```

Defined in: packages/client/src/graphorin-client.ts:75

**`Stable`**

Discriminator for the subscription target. Mirrors the strict
subject grammar enforced by the server:
 - `'session'`/`<id>` ⇒ `'session:<id>/events'`
 - `'agent'`/`<id>` + `runId` ⇒ `'agent:<id>/runs/<runId>/events'`
 - `'run'`/`<runId>` ⇒ `'session:<sessionId>/runs/<runId>/events'`
   (when `sessionId` is provided)
 - `'workflow'`/`<id>` ⇒ `'workflow:<id>/events'`, or
   `'workflow:<id>/runs/<runId>/events'` when the optional `runId`
   is present (the run-scoped subject advertised by the workflow
   execute/resume routes)

## Union Members

### Type Literal

```ts
{
  id: string;
  target: "session";
}
```

***

### Type Literal

```ts
{
  id: string;
  runId: string;
  target: "agent";
}
```

***

### Type Literal

```ts
{
  runId: string;
  sessionId?: string;
  target: "run";
}
```

***

### Type Literal

```ts
{
  id: string;
  runId?: string;
  target: "workflow";
}
```

| Name | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| `id` | `string` | - | packages/client/src/graphorin-client.ts:89 |
| `runId?` | `string` | The server emits workflow run events ONLY on the run-scoped subject (`workflow:<id>/runs/<runId>/events`) advertised by `POST /v1/workflows/:id/execute` (and resume), never on the base `workflow:<id>/events` subject - pass the advertised `runId` to receive them. | packages/client/src/graphorin-client.ts:97 |
| `target` | `"workflow"` | - | packages/client/src/graphorin-client.ts:88 |
