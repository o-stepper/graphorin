[**Graphorin API reference v0.10.0**](../../../index.md)

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
  dispatchReplay: void;
}
  | {
  ok: false;
  reason:   | "subject-malformed"
     | "subject-unknown"
     | "subject-wildcard"
     | "scope-denied";
};
```

Defined in: [packages/server/src/ws/dispatcher.ts:117](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/dispatcher.ts#L117)

Result of [WsDispatcher.subscribe](/api/@graphorin/server/interfaces/WsDispatcher.md#subscribe).

## Union Members

### Type Literal

```ts
{
  ok: true;
  replayedCount: number;
  snapshotEventId: string | undefined;
  subscription: WsSubscriptionSnapshot;
  dispatchReplay: void;
}
```

| Name | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| `ok` | `true` | - | [packages/server/src/ws/dispatcher.ts:119](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/dispatcher.ts#L119) |
| `replayedCount` | `number` | - | [packages/server/src/ws/dispatcher.ts:121](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/dispatcher.ts#L121) |
| `snapshotEventId` | `string` \| `undefined` | - | [packages/server/src/ws/dispatcher.ts:122](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/dispatcher.ts#L122) |
| `subscription` | [`WsSubscriptionSnapshot`](/api/@graphorin/server/interfaces/WsSubscriptionSnapshot.md) | - | [packages/server/src/ws/dispatcher.ts:120](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/dispatcher.ts#L120) |
| `dispatchReplay()` | () => `void` | E-02 (S-15/8): deliver the replay frames captured at subscribe time. Idempotent - the second call is a no-op. When `deferReplay` was not requested the frames were already dispatched inside `subscribe()` and this is a no-op too. | [packages/server/src/ws/dispatcher.ts:129](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/dispatcher.ts#L129) |

***

### Type Literal

```ts
{
  ok: false;
  reason:   | "subject-malformed"
     | "subject-unknown"
     | "subject-wildcard"
     | "scope-denied";
}
```

## Stable
