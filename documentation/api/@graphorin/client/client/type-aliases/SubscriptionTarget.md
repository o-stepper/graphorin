[**Graphorin API reference v0.6.1**](../../../../index.md)

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
  target: "workflow";
};
```

Defined in: [packages/client/src/graphorin-client.ts:72](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/graphorin-client.ts#L72)

Discriminator for the subscription target. Mirrors the strict
subject grammar enforced by the server:
 - `'session'`/`<id>` ⇒ `'session:<id>/events'`
 - `'agent'`/`<id>` + `runId` ⇒ `'agent:<id>/runs/<runId>/events'`
 - `'run'`/`<runId>` ⇒ `'session:<sessionId>/runs/<runId>/events'`
   (when `sessionId` is provided)
 - `'workflow'`/`<id>` ⇒ `'workflow:<id>/events'`

## Stable
