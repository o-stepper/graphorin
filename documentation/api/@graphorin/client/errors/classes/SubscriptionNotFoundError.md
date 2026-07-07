[**Graphorin API reference v0.7.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/client](/api/@graphorin/client/index.md) / [errors](/api/@graphorin/client/errors/index.md) / SubscriptionNotFoundError

# Class: SubscriptionNotFoundError

Defined in: [packages/client/src/errors.ts:137](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/errors.ts#L137)

## Stable

## Extends

- [`GraphorinClientError`](/api/@graphorin/client/errors/classes/GraphorinClientError.md)

## Constructors

### Constructor

```ts
new SubscriptionNotFoundError(subscriptionId): SubscriptionNotFoundError;
```

Defined in: [packages/client/src/errors.ts:140](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/errors.ts#L140)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `subscriptionId` | `string` |

#### Returns

`SubscriptionNotFoundError`

#### Overrides

[`GraphorinClientError`](/api/@graphorin/client/errors/classes/GraphorinClientError.md).[`constructor`](/api/@graphorin/client/errors/classes/GraphorinClientError.md#constructor)

## Properties

| Property | Modifier | Type | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-cause"></a> `cause?` | `public` | `unknown` | [`GraphorinClientError`](/api/@graphorin/client/errors/classes/GraphorinClientError.md).[`cause`](/api/@graphorin/client/errors/classes/GraphorinClientError.md#property-cause) | [node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.es2022.error.d.ts:26](https://github.com/o-stepper/graphorin/blob/main/node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2022.error.d.ts#L26) |
| <a id="property-kind"></a> `kind` | `readonly` | [`GraphorinClientErrorKind`](/api/@graphorin/client/errors/type-aliases/GraphorinClientErrorKind.md) | [`GraphorinClientError`](/api/@graphorin/client/errors/classes/GraphorinClientError.md).[`kind`](/api/@graphorin/client/errors/classes/GraphorinClientError.md#property-kind) | [packages/client/src/errors.ts:76](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/errors.ts#L76) |
| <a id="property-message"></a> `message` | `public` | `string` | [`GraphorinClientError`](/api/@graphorin/client/errors/classes/GraphorinClientError.md).[`message`](/api/@graphorin/client/errors/classes/GraphorinClientError.md#property-message) | [node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.es5.d.ts:1077](https://github.com/o-stepper/graphorin/blob/main/node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es5.d.ts#L1077) |
| <a id="property-name"></a> `name` | `public` | `string` | [`GraphorinClientError`](/api/@graphorin/client/errors/classes/GraphorinClientError.md).[`name`](/api/@graphorin/client/errors/classes/GraphorinClientError.md#property-name) | [node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.es5.d.ts:1076](https://github.com/o-stepper/graphorin/blob/main/node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es5.d.ts#L1076) |
| <a id="property-stack"></a> `stack?` | `public` | `string` | [`GraphorinClientError`](/api/@graphorin/client/errors/classes/GraphorinClientError.md).[`stack`](/api/@graphorin/client/errors/classes/GraphorinClientError.md#property-stack) | [node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.es5.d.ts:1078](https://github.com/o-stepper/graphorin/blob/main/node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es5.d.ts#L1078) |
| <a id="property-subscriptionid"></a> `subscriptionId` | `readonly` | `string` | - | [packages/client/src/errors.ts:138](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/errors.ts#L138) |
