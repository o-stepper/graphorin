[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / WsDispatcherWarning

# Type Alias: WsDispatcherWarning

```ts
type WsDispatcherWarning = 
  | {
  issues: ReadonlyArray<string>;
  kind: "invalid-frame";
  subscriptionId: string;
}
  | {
  kind: "queue-overflow";
  subscriptionId: string;
}
  | {
  kind: "subject-rejected";
  reason: string;
  subject: string;
};
```

Defined in: packages/server/src/ws/dispatcher.ts:59

Discriminator surfaced to the optional warn sink.

## Stable
