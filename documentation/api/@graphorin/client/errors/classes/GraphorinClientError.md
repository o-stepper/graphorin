[**Graphorin API reference v0.10.2**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/client](/api/@graphorin/client/index.md) / [errors](/api/@graphorin/client/errors/index.md) / GraphorinClientError

# Class: GraphorinClientError

Defined in: [packages/client/src/errors.ts:75](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/errors.ts#L75)

Base class for every error raised by `@graphorin/client`. Carries a
stable [GraphorinClientErrorKind](/api/@graphorin/client/errors/type-aliases/GraphorinClientErrorKind.md) discriminator and an
optional `cause` chain.

## Stable

## Extends

- `Error`

## Extended by

- [`ClientNotConnectedError`](/api/@graphorin/client/errors/classes/ClientNotConnectedError.md)
- [`TransportFailedError`](/api/@graphorin/client/errors/classes/TransportFailedError.md)
- [`SubprotocolMismatchError`](/api/@graphorin/client/errors/classes/SubprotocolMismatchError.md)
- [`AuthFailedError`](/api/@graphorin/client/errors/classes/AuthFailedError.md)
- [`ProtocolViolationError`](/api/@graphorin/client/errors/classes/ProtocolViolationError.md)
- [`SubscriptionNotFoundError`](/api/@graphorin/client/errors/classes/SubscriptionNotFoundError.md)
- [`ClientAbortedError`](/api/@graphorin/client/errors/classes/ClientAbortedError.md)
- [`InvalidServerFrameError`](/api/@graphorin/client/errors/classes/InvalidServerFrameError.md)

## Constructors

### Constructor

```ts
new GraphorinClientError(
   kind, 
   message, 
   options?): GraphorinClientError;
```

Defined in: [packages/client/src/errors.ts:78](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/errors.ts#L78)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `kind` | [`GraphorinClientErrorKind`](/api/@graphorin/client/errors/type-aliases/GraphorinClientErrorKind.md) |
| `message` | `string` |
| `options` | `ErrorOptions` |

#### Returns

`GraphorinClientError`

#### Overrides

```ts
Error.constructor
```

## Properties

| Property | Modifier | Type | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-cause"></a> `cause?` | `public` | `unknown` | `Error.cause` | [node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.es2022.error.d.ts:26](https://github.com/o-stepper/graphorin/blob/main/node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2022.error.d.ts#L26) |
| <a id="property-kind"></a> `kind` | `readonly` | [`GraphorinClientErrorKind`](/api/@graphorin/client/errors/type-aliases/GraphorinClientErrorKind.md) | - | [packages/client/src/errors.ts:76](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/errors.ts#L76) |
| <a id="property-message"></a> `message` | `public` | `string` | `Error.message` | [node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.es5.d.ts:1077](https://github.com/o-stepper/graphorin/blob/main/node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es5.d.ts#L1077) |
| <a id="property-name"></a> `name` | `public` | `string` | `Error.name` | [node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.es5.d.ts:1076](https://github.com/o-stepper/graphorin/blob/main/node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es5.d.ts#L1076) |
| <a id="property-stack"></a> `stack?` | `public` | `string` | `Error.stack` | [node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.es5.d.ts:1078](https://github.com/o-stepper/graphorin/blob/main/node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es5.d.ts#L1078) |
