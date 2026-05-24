[**Graphorin API reference v0.3.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/client](/api/@graphorin/client/index.md) / [client](/api/@graphorin/client/client/index.md) / Subscription

# Interface: Subscription

Defined in: packages/client/src/graphorin-client.ts:145

Public surface returned by [GraphorinClient.subscribe](/api/@graphorin/client/client/classes/GraphorinClient.md#subscribe).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-subject"></a> `subject` | `readonly` | `string` | packages/client/src/graphorin-client.ts:147 |
| <a id="property-subscriptionid"></a> `subscriptionId` | `readonly` | `string` | packages/client/src/graphorin-client.ts:146 |

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

Defined in: packages/client/src/graphorin-client.ts:148

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

Defined in: packages/client/src/graphorin-client.ts:153

#### Returns

[`SubscriptionMetadata`](/api/@graphorin/client/client/interfaces/SubscriptionMetadata.md)

***

### unsubscribe()

```ts
unsubscribe(): Promise<void>;
```

Defined in: packages/client/src/graphorin-client.ts:152

Close the subscription on the server. Idempotent.

#### Returns

`Promise`\&lt;`void`\&gt;
