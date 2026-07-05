[**Graphorin API reference v0.6.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/client](/api/@graphorin/client/index.md) / [client](/api/@graphorin/client/client/index.md) / Subscription

# Interface: Subscription

Defined in: packages/client/src/graphorin-client.ts:162

Public surface returned by [GraphorinClient.subscribe](/api/@graphorin/client/client/classes/GraphorinClient.md#subscribe).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-subject"></a> `subject` | `readonly` | `string` | packages/client/src/graphorin-client.ts:164 |
| <a id="property-subscriptionid"></a> `subscriptionId` | `readonly` | `string` | packages/client/src/graphorin-client.ts:163 |

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

Defined in: packages/client/src/graphorin-client.ts:165

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

Defined in: packages/client/src/graphorin-client.ts:170

#### Returns

[`SubscriptionMetadata`](/api/@graphorin/client/client/interfaces/SubscriptionMetadata.md)

***

### unsubscribe()

```ts
unsubscribe(): Promise<void>;
```

Defined in: packages/client/src/graphorin-client.ts:169

Close the subscription on the server. Idempotent.

#### Returns

`Promise`\&lt;`void`\&gt;
