[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / TokenVerifyOverloadError

# Class: TokenVerifyOverloadError

Defined in: [packages/security/src/auth/errors.ts:76](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/errors.ts#L76)

Raised when `verifyToken(...)` is called from more concurrent in-
flight verifies than the configured cap allows. Used as a defensive
back-pressure signal under suspected DoS conditions; the HMAC verify
itself is too cheap to OOM the process, but a cap keeps log noise
and CPU contention bounded.

## Stable

## Extends

- [`GraphorinSecretsError`](/api/@graphorin/security/classes/GraphorinSecretsError.md)

## Constructors

### Constructor

```ts
new TokenVerifyOverloadError(inFlight, cap): TokenVerifyOverloadError;
```

Defined in: [packages/security/src/auth/errors.ts:81](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/errors.ts#L81)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `inFlight` | `number` |
| `cap` | `number` |

#### Returns

`TokenVerifyOverloadError`

#### Overrides

[`GraphorinSecretsError`](/api/@graphorin/security/classes/GraphorinSecretsError.md).[`constructor`](/api/@graphorin/security/classes/GraphorinSecretsError.md#constructor)

## Properties

| Property | Modifier | Type | Default value | Description | Overrides | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-cap"></a> `cap` | `readonly` | `number` | `undefined` | - | - | - | [packages/security/src/auth/errors.ts:79](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/errors.ts#L79) |
| <a id="property-cause"></a> `cause?` | `public` | `unknown` | `undefined` | - | - | [`GraphorinSecretsError`](/api/@graphorin/security/classes/GraphorinSecretsError.md).[`cause`](/api/@graphorin/security/classes/GraphorinSecretsError.md#property-cause) | [node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.es2022.error.d.ts:26](https://github.com/o-stepper/graphorin/blob/main/node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2022.error.d.ts#L26) |
| <a id="property-hint"></a> `hint?` | `readonly` | `string` | `undefined` | Optional remediation hint (CLI command or doc link). | - | [`GraphorinSecretsError`](/api/@graphorin/security/classes/GraphorinSecretsError.md).[`hint`](/api/@graphorin/security/classes/GraphorinSecretsError.md#property-hint) | [packages/security/src/secrets/errors.ts:21](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/errors.ts#L21) |
| <a id="property-inflight"></a> `inFlight` | `readonly` | `number` | `undefined` | - | - | - | [packages/security/src/auth/errors.ts:78](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/errors.ts#L78) |
| <a id="property-kind"></a> `kind` | `readonly` | `"token-verify-overload"` | `'token-verify-overload'` | Stable lowercase discriminator. Subclasses fix this to a literal. | [`GraphorinSecretsError`](/api/@graphorin/security/classes/GraphorinSecretsError.md).[`kind`](/api/@graphorin/security/classes/GraphorinSecretsError.md#property-kind) | - | [packages/security/src/auth/errors.ts:77](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/errors.ts#L77) |
| <a id="property-message"></a> `message` | `public` | `string` | `undefined` | - | - | [`GraphorinSecretsError`](/api/@graphorin/security/classes/GraphorinSecretsError.md).[`message`](/api/@graphorin/security/classes/GraphorinSecretsError.md#property-message) | [node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.es5.d.ts:1077](https://github.com/o-stepper/graphorin/blob/main/node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es5.d.ts#L1077) |
| <a id="property-name"></a> `name` | `public` | `string` | `undefined` | - | - | [`GraphorinSecretsError`](/api/@graphorin/security/classes/GraphorinSecretsError.md).[`name`](/api/@graphorin/security/classes/GraphorinSecretsError.md#property-name) | [node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.es5.d.ts:1076](https://github.com/o-stepper/graphorin/blob/main/node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es5.d.ts#L1076) |
| <a id="property-stack"></a> `stack?` | `public` | `string` | `undefined` | - | - | [`GraphorinSecretsError`](/api/@graphorin/security/classes/GraphorinSecretsError.md).[`stack`](/api/@graphorin/security/classes/GraphorinSecretsError.md#property-stack) | [node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.es5.d.ts:1078](https://github.com/o-stepper/graphorin/blob/main/node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es5.d.ts#L1078) |
| <a id="property-stacktracelimit"></a> `stackTraceLimit` | `static` | `number` | `undefined` | The `Error.stackTraceLimit` property specifies the number of stack frames collected by a stack trace (whether generated by `new Error().stack` or `Error.captureStackTrace(obj)`). The default value is `10` but may be set to any valid JavaScript number. Changes will affect any stack trace captured _after_ the value has been changed. If set to a non-number value, or set to a negative number, stack traces will not capture any frames. | - | [`GraphorinSecretsError`](/api/@graphorin/security/classes/GraphorinSecretsError.md).[`stackTraceLimit`](/api/@graphorin/security/classes/GraphorinSecretsError.md#property-stacktracelimit) | [node\_modules/.pnpm/@types+node@22.19.17/node\_modules/@types/node/globals.d.ts:68](https://github.com/o-stepper/graphorin/blob/main/node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/globals.d.ts#L68) |

## Methods

### captureStackTrace()

```ts
static captureStackTrace(targetObject, constructorOpt?): void;
```

Defined in: [node\_modules/.pnpm/@types+node@22.19.17/node\_modules/@types/node/globals.d.ts:52](https://github.com/o-stepper/graphorin/blob/main/node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/globals.d.ts#L52)

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

[`GraphorinSecretsError`](/api/@graphorin/security/classes/GraphorinSecretsError.md).[`captureStackTrace`](/api/@graphorin/security/classes/GraphorinSecretsError.md#capturestacktrace)

***

### prepareStackTrace()

```ts
static prepareStackTrace(err, stackTraces): any;
```

Defined in: [node\_modules/.pnpm/@types+node@22.19.17/node\_modules/@types/node/globals.d.ts:56](https://github.com/o-stepper/graphorin/blob/main/node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/globals.d.ts#L56)

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

[`GraphorinSecretsError`](/api/@graphorin/security/classes/GraphorinSecretsError.md).[`prepareStackTrace`](/api/@graphorin/security/classes/GraphorinSecretsError.md#preparestacktrace)
