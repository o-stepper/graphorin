[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / ProviderHttpError

# Class: ProviderHttpError

Defined in: packages/provider/src/errors/errors.ts:248

**`Stable`**

Wrapped HTTP error returned by an adapter. Carries the original
status code so middleware (`withRetry`, `withFallback`) can decide
whether the error is retryable.

## Extends

- [`GraphorinProviderError`](/api/@graphorin/provider/classes/GraphorinProviderError.md)

## Constructors

### Constructor

```ts
new ProviderHttpError(args): ProviderHttpError;
```

Defined in: packages/provider/src/errors/errors.ts:266

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | \{ `cause?`: `unknown`; `errorKind?`: [`ProviderErrorKind`](/api/@graphorin/core/type-aliases/ProviderErrorKind.md); `headers?`: `Readonly`\<`Record`\&lt;`string`, `string`\&gt;\>; `message`: `string`; `providerName`: `string`; `status`: `number`; \} |
| `args.cause?` | `unknown` |
| `args.errorKind?` | [`ProviderErrorKind`](/api/@graphorin/core/type-aliases/ProviderErrorKind.md) |
| `args.headers?` | `Readonly`\<`Record`\&lt;`string`, `string`\&gt;\> |
| `args.message` | `string` |
| `args.providerName` | `string` |
| `args.status` | `number` |

#### Returns

`ProviderHttpError`

#### Overrides

[`GraphorinProviderError`](/api/@graphorin/provider/classes/GraphorinProviderError.md).[`constructor`](/api/@graphorin/provider/classes/GraphorinProviderError.md#constructor)

## Properties

| Property | Modifier | Type | Default value | Description | Overrides | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-cause"></a> `cause?` | `public` | `unknown` | `undefined` | - | - | [`GraphorinProviderError`](/api/@graphorin/provider/classes/GraphorinProviderError.md).[`cause`](/api/@graphorin/provider/classes/GraphorinProviderError.md#property-cause) | node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.es2022.error.d.ts:26 |
| <a id="property-errorkind"></a> `errorKind` | `readonly` | [`ProviderErrorKind`](/api/@graphorin/core/type-aliases/ProviderErrorKind.md) | `undefined` | The canonical `ProviderErrorKind` mapped from the HTTP status via [classifyHttpStatus](/api/@graphorin/provider/functions/classifyHttpStatus.md) (the `kind` field keeps its stable `'provider-http'` discriminant). Middleware predicates consult this so a 429 fails over / retries as a rate limit. | - | - | packages/provider/src/errors/errors.ts:258 |
| <a id="property-headers"></a> `headers?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `string`\&gt;\> | `undefined` | Backoff-relevant response headers captured from the failed response (`retry-after`, `x-ratelimit-*`), lowercased. `withRetry`'s Retry-After hint reader consumes them. | - | - | packages/provider/src/errors/errors.ts:264 |
| <a id="property-hint"></a> `hint?` | `readonly` | `string` | `undefined` | Optional remediation hint shown alongside the message. | - | [`GraphorinProviderError`](/api/@graphorin/provider/classes/GraphorinProviderError.md).[`hint`](/api/@graphorin/provider/classes/GraphorinProviderError.md#property-hint) | packages/provider/src/errors/errors.ts:23 |
| <a id="property-kind"></a> `kind` | `readonly` | `string` | `undefined` | Stable discriminant - `'middleware-ordering'`, `'rate-limit-exceeded'`, … | - | [`GraphorinProviderError`](/api/@graphorin/provider/classes/GraphorinProviderError.md).[`kind`](/api/@graphorin/provider/classes/GraphorinProviderError.md#property-kind) | packages/provider/src/errors/errors.ts:21 |
| <a id="property-message"></a> `message` | `public` | `string` | `undefined` | - | - | [`GraphorinProviderError`](/api/@graphorin/provider/classes/GraphorinProviderError.md).[`message`](/api/@graphorin/provider/classes/GraphorinProviderError.md#property-message) | node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.es5.d.ts:1077 |
| <a id="property-name"></a> `name` | `readonly` | `"ProviderHttpError"` | `'ProviderHttpError'` | - | [`GraphorinProviderError`](/api/@graphorin/provider/classes/GraphorinProviderError.md).[`name`](/api/@graphorin/provider/classes/GraphorinProviderError.md#property-name) | - | packages/provider/src/errors/errors.ts:249 |
| <a id="property-providername"></a> `providerName` | `readonly` | `string` | `undefined` | - | - | - | packages/provider/src/errors/errors.ts:251 |
| <a id="property-stack"></a> `stack?` | `public` | `string` | `undefined` | - | - | [`GraphorinProviderError`](/api/@graphorin/provider/classes/GraphorinProviderError.md).[`stack`](/api/@graphorin/provider/classes/GraphorinProviderError.md#property-stack) | node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.es5.d.ts:1078 |
| <a id="property-status"></a> `status` | `readonly` | `number` | `undefined` | - | - | - | packages/provider/src/errors/errors.ts:250 |
| <a id="property-stacktracelimit"></a> `stackTraceLimit` | `static` | `number` | `undefined` | The `Error.stackTraceLimit` property specifies the number of stack frames collected by a stack trace (whether generated by `new Error().stack` or `Error.captureStackTrace(obj)`). The default value is `10` but may be set to any valid JavaScript number. Changes will affect any stack trace captured _after_ the value has been changed. If set to a non-number value, or set to a negative number, stack traces will not capture any frames. | - | [`GraphorinProviderError`](/api/@graphorin/provider/classes/GraphorinProviderError.md).[`stackTraceLimit`](/api/@graphorin/provider/classes/GraphorinProviderError.md#property-stacktracelimit) | node\_modules/.pnpm/@types+node@22.19.17/node\_modules/@types/node/globals.d.ts:68 |

## Methods

### captureStackTrace()

```ts
static captureStackTrace(targetObject, constructorOpt?): void;
```

Defined in: node\_modules/.pnpm/@types+node@22.19.17/node\_modules/@types/node/globals.d.ts:52

Creates a `.stack` property on `targetObject`, which when accessed returns
a string representing the location in the code at which
`Error.captureStackTrace()` was called.

```js
const myObject = {};
Error.captureStackTrace(myObject);
myObject.stack;  // Similar to `new Error().stack`
```

The first line of the trace will be prefixed with
`${myObject.name}: ${myObject.message}`.

The optional `constructorOpt` argument accepts a function. If given, all frames
above `constructorOpt`, including `constructorOpt`, will be omitted from the
generated stack trace.

The `constructorOpt` argument is useful for hiding implementation
details of error generation from the user. For instance:

```js
function a() {
  b();
}

function b() {
  c();
}

function c() {
  // Create an error without stack trace to avoid calculating the stack trace twice.
  const { stackTraceLimit } = Error;
  Error.stackTraceLimit = 0;
  const error = new Error();
  Error.stackTraceLimit = stackTraceLimit;

  // Capture the stack trace above function b
  Error.captureStackTrace(error, b); // Neither function c, nor b is included in the stack trace
  throw error;
}

a();
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `targetObject` | `object` |
| `constructorOpt?` | `Function` |

#### Returns

`void`

#### Inherited from

[`GraphorinProviderError`](/api/@graphorin/provider/classes/GraphorinProviderError.md).[`captureStackTrace`](/api/@graphorin/provider/classes/GraphorinProviderError.md#capturestacktrace)

***

### prepareStackTrace()

```ts
static prepareStackTrace(err, stackTraces): any;
```

Defined in: node\_modules/.pnpm/@types+node@22.19.17/node\_modules/@types/node/globals.d.ts:56

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `err` | `Error` |
| `stackTraces` | `CallSite`[] |

#### Returns

`any`

#### See

https://v8.dev/docs/stack-trace-api#customizing-stack-traces

#### Inherited from

[`GraphorinProviderError`](/api/@graphorin/provider/classes/GraphorinProviderError.md).[`prepareStackTrace`](/api/@graphorin/provider/classes/GraphorinProviderError.md#preparestacktrace)
