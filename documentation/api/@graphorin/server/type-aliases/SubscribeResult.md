[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / SubscribeResult

# Type Alias: SubscribeResult

```ts
type SubscribeResult = 
  | {
  ok: true;
  replayedCount: number;
  snapshotEventId: string | undefined;
  subscription: WsSubscriptionSnapshot;
}
  | {
  ok: false;
  reason:   | "subject-malformed"
     | "subject-unknown"
     | "subject-wildcard"
     | "scope-denied";
};
```

Defined in: packages/server/src/ws/dispatcher.ts:116

Result of [WsDispatcher.subscribe](/api/@graphorin/server/interfaces/WsDispatcher.md#subscribe).

## Stable
