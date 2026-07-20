[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / DeliveryCommentarySanitizer

# Interface: DeliveryCommentarySanitizer

Defined in: packages/server/src/commentary/sanitizer.ts:49

**`Stable`**

Public surface returned by [createDeliveryCommentarySanitizer](/api/@graphorin/server/functions/createDeliveryCommentarySanitizer.md).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-applytoevents"></a> `applyToEvents` | `readonly` | readonly `string`[] | packages/server/src/commentary/sanitizer.ts:51 |
| <a id="property-patterns"></a> `patterns` | `readonly` | readonly [`DeliveryCommentaryPattern`](/api/@graphorin/server/interfaces/DeliveryCommentaryPattern.md)[] | packages/server/src/commentary/sanitizer.ts:52 |
| <a id="property-policy"></a> `policy` | `readonly` | [`DeliveryCommentaryPolicy`](/api/@graphorin/server/type-aliases/DeliveryCommentaryPolicy.md) | packages/server/src/commentary/sanitizer.ts:50 |

## Methods

### sanitize()

```ts
sanitize(frame, transport): {
  eventId: string;
  kind: "event";
  payload?: unknown;
  subject: string;
  subscriptionId: string;
  type: string;
  v: "1";
};
```

Defined in: packages/server/src/commentary/sanitizer.ts:63

Sanitize the payload of a single `event` frame. Returns the
(possibly-replaced) frame; emits an audit decision via the
configured sink when the sanitizer mutated the payload.

The frame is returned unchanged when:
  - the policy is `'pass-through'`,
  - the event type is not in `applyToEvents`,
  - or no pattern matched the JSON-stringified payload.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `frame` | \{ `eventId`: `string`; `kind`: `"event"`; `payload?`: `unknown`; `subject`: `string`; `subscriptionId`: `string`; `type`: `string`; `v`: `"1"`; \} |
| `frame.eventId` | `string` |
| `frame.kind` | `"event"` |
| `frame.payload?` | `unknown` |
| `frame.subject` | `string` |
| `frame.subscriptionId` | `string` |
| `frame.type` | `string` |
| `frame.v` | `"1"` |
| `transport` | [`DeliveryCommentaryTransport`](/api/@graphorin/server/type-aliases/DeliveryCommentaryTransport.md) |

#### Returns

```ts
{
  eventId: string;
  kind: "event";
  payload?: unknown;
  subject: string;
  subscriptionId: string;
  type: string;
  v: "1";
}
```

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `eventId` | `string` | [packages/protocol/dist/server-message.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/protocol/dist/server-message.d.ts) |
| `kind` | `"event"` | [packages/protocol/dist/server-message.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/protocol/dist/server-message.d.ts) |
| `payload?` | `unknown` | [packages/protocol/dist/server-message.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/protocol/dist/server-message.d.ts) |
| `subject` | `string` | [packages/protocol/dist/server-message.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/protocol/dist/server-message.d.ts) |
| `subscriptionId` | `string` | [packages/protocol/dist/server-message.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/protocol/dist/server-message.d.ts) |
| `type` | `string` | [packages/protocol/dist/server-message.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/protocol/dist/server-message.d.ts) |
| `v` | `"1"` | [packages/protocol/dist/server-message.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/protocol/dist/server-message.d.ts) |
