[**Graphorin API reference v0.13.10**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [commentary](/api/@graphorin/server/commentary/index.md) / LateBoundCommentarySink

# Interface: LateBoundCommentarySink

Defined in: packages/server/src/commentary/audit-bridge.ts:111

**`Stable`**

A [DeliveryCommentarySink](/api/@graphorin/server/interfaces/DeliveryCommentarySink.md) whose real target is installed later. The WS
dispatcher is created before the audit DB opens; the server hands it
this forwarding sink and calls [LateBoundCommentarySink.bind](/api/@graphorin/server/commentary/interfaces/LateBoundCommentarySink.md#bind) once the
audit-writing sink exists. Decisions emitted before binding are dropped - the
dispatcher only sanitizes once it is live (after `start()`, by which point
the audit DB, if configured, has opened and bound).

## Extends

- [`DeliveryCommentarySink`](/api/@graphorin/server/interfaces/DeliveryCommentarySink.md)

## Methods

### bind()

```ts
bind(target): void;
```

Defined in: packages/server/src/commentary/audit-bridge.ts:113

Install the real sink. Replaces any previously-bound target.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | [`DeliveryCommentarySink`](/api/@graphorin/server/interfaces/DeliveryCommentarySink.md) |

#### Returns

`void`

***

### onDecision()

```ts
onDecision(decision): void;
```

Defined in: packages/server/src/commentary/types.ts:106

Called once per applied decision. Implementations should be
non-throwing; the sanitizer wraps the call in `try/catch` so a
misbehaving sink never blocks the wire.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `decision` | [`DeliveryCommentaryDecision`](/api/@graphorin/server/interfaces/DeliveryCommentaryDecision.md) |

#### Returns

`void`

#### Inherited from

[`DeliveryCommentarySink`](/api/@graphorin/server/interfaces/DeliveryCommentarySink.md).[`onDecision`](/api/@graphorin/server/interfaces/DeliveryCommentarySink.md#ondecision)
