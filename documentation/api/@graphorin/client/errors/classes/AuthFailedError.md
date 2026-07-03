[**Graphorin API reference v0.5.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/client](/api/@graphorin/client/index.md) / [errors](/api/@graphorin/client/errors/index.md) / AuthFailedError

# Class: AuthFailedError

Defined in: packages/client/src/errors.ts:114

## Stable

## Extends

- [`GraphorinClientError`](/api/@graphorin/client/errors/classes/GraphorinClientError.md)

## Constructors

### Constructor

```ts
new AuthFailedError(message?): AuthFailedError;
```

Defined in: packages/client/src/errors.ts:115

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `message` | `string` | `'Authentication failed. Re-mint a token or request a new ticket.'` |

#### Returns

`AuthFailedError`

#### Overrides

[`GraphorinClientError`](/api/@graphorin/client/errors/classes/GraphorinClientError.md).[`constructor`](/api/@graphorin/client/errors/classes/GraphorinClientError.md#constructor)

## Properties

| Property | Modifier | Type | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-cause"></a> `cause?` | `public` | `unknown` | [`GraphorinClientError`](/api/@graphorin/client/errors/classes/GraphorinClientError.md).[`cause`](/api/@graphorin/client/errors/classes/GraphorinClientError.md#property-cause) | node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.es2022.error.d.ts:26 |
| <a id="property-kind"></a> `kind` | `readonly` | [`GraphorinClientErrorKind`](/api/@graphorin/client/errors/type-aliases/GraphorinClientErrorKind.md) | [`GraphorinClientError`](/api/@graphorin/client/errors/classes/GraphorinClientError.md).[`kind`](/api/@graphorin/client/errors/classes/GraphorinClientError.md#property-kind) | packages/client/src/errors.ts:69 |
| <a id="property-message"></a> `message` | `public` | `string` | [`GraphorinClientError`](/api/@graphorin/client/errors/classes/GraphorinClientError.md).[`message`](/api/@graphorin/client/errors/classes/GraphorinClientError.md#property-message) | node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.es5.d.ts:1077 |
| <a id="property-name"></a> `name` | `public` | `string` | [`GraphorinClientError`](/api/@graphorin/client/errors/classes/GraphorinClientError.md).[`name`](/api/@graphorin/client/errors/classes/GraphorinClientError.md#property-name) | node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.es5.d.ts:1076 |
| <a id="property-stack"></a> `stack?` | `public` | `string` | [`GraphorinClientError`](/api/@graphorin/client/errors/classes/GraphorinClientError.md).[`stack`](/api/@graphorin/client/errors/classes/GraphorinClientError.md#property-stack) | node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.es5.d.ts:1078 |
