[**Graphorin API reference v0.9.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/client](/api/@graphorin/client/index.md) / [client](/api/@graphorin/client/client/index.md) / Subscription

# Interface: Subscription

Defined in: [packages/client/src/graphorin-client.ts:198](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/graphorin-client.ts#L198)

Public surface returned by [GraphorinClient.subscribe](/api/@graphorin/client/client/classes/GraphorinClient.md#subscribe).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-subject"></a> `subject` | `readonly` | `string` | [packages/client/src/graphorin-client.ts:200](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/graphorin-client.ts#L200) |
| <a id="property-subscriptionid"></a> `subscriptionId` | `readonly` | `string` | [packages/client/src/graphorin-client.ts:199](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/graphorin-client.ts#L199) |

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

Defined in: [packages/client/src/graphorin-client.ts:201](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/graphorin-client.ts#L201)

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

Defined in: [packages/client/src/graphorin-client.ts:206](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/graphorin-client.ts#L206)

#### Returns

[`SubscriptionMetadata`](/api/@graphorin/client/client/interfaces/SubscriptionMetadata.md)

***

### unsubscribe()

```ts
unsubscribe(): Promise<void>;
```

Defined in: [packages/client/src/graphorin-client.ts:205](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/graphorin-client.ts#L205)

Close the subscription on the server. Idempotent.

#### Returns

`Promise`\&lt;`void`\&gt;
