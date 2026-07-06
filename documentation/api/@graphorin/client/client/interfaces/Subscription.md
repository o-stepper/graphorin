[**Graphorin API reference v0.6.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/client](/api/@graphorin/client/index.md) / [client](/api/@graphorin/client/client/index.md) / Subscription

# Interface: Subscription

Defined in: [packages/client/src/graphorin-client.ts:184](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/graphorin-client.ts#L184)

Public surface returned by [GraphorinClient.subscribe](/api/@graphorin/client/client/classes/GraphorinClient.md#subscribe).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-subject"></a> `subject` | `readonly` | `string` | [packages/client/src/graphorin-client.ts:186](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/graphorin-client.ts#L186) |
| <a id="property-subscriptionid"></a> `subscriptionId` | `readonly` | `string` | [packages/client/src/graphorin-client.ts:185](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/graphorin-client.ts#L185) |

## Methods

### events()

```ts
events(): AsyncIterable<{
  eventId: string;
  kind: "event";
  payload?: unknown;
  subject: string;
  subscriptionId: string;
  type: string;
  v: "1";
}>;
```

Defined in: [packages/client/src/graphorin-client.ts:187](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/graphorin-client.ts#L187)

#### Returns

`AsyncIterable`\<\{
  `eventId`: `string`;
  `kind`: `"event"`;
  `payload?`: `unknown`;
  `subject`: `string`;
  `subscriptionId`: `string`;
  `type`: `string`;
  `v`: `"1"`;
\}\>

***

### metadata()

```ts
metadata(): SubscriptionMetadata;
```

Defined in: [packages/client/src/graphorin-client.ts:192](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/graphorin-client.ts#L192)

#### Returns

[`SubscriptionMetadata`](/api/@graphorin/client/client/interfaces/SubscriptionMetadata.md)

***

### unsubscribe()

```ts
unsubscribe(): Promise<void>;
```

Defined in: [packages/client/src/graphorin-client.ts:191](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/graphorin-client.ts#L191)

Close the subscription on the server. Idempotent.

#### Returns

`Promise`\&lt;`void`\&gt;
