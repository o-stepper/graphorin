[**Graphorin API reference v0.10.1**](../../../index.md)

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

Defined in: [packages/server/src/ws/dispatcher.ts:60](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/dispatcher.ts#L60)

Discriminator surfaced to the optional warn sink.

## Stable
