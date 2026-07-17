[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / UnsupportedSandboxKindError

# Class: UnsupportedSandboxKindError

Defined in: [packages/security/src/sandbox/errors.ts:26](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/errors.ts#L26)

Raised when the sandbox dispatcher receives a `SandboxKind` it
cannot satisfy and the resolver is configured to fail fast.

## Stable

## Extends

- [`GraphorinSandboxError`](/api/@graphorin/security/classes/GraphorinSandboxError.md)

## Constructors

### Constructor

```ts
new UnsupportedSandboxKindError(requested, available): UnsupportedSandboxKindError;
```

Defined in: [packages/security/src/sandbox/errors.ts:32](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/errors.ts#L32)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `requested` | `string` |
| `available` | readonly `string`[] |

#### Returns

`UnsupportedSandboxKindError`

#### Overrides

[`GraphorinSandboxError`](/api/@graphorin/security/classes/GraphorinSandboxError.md).[`constructor`](/api/@graphorin/security/classes/GraphorinSandboxError.md#constructor)

## Properties

| Property | Modifier | Type | Default value | Description | Overrides | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-available"></a> `available` | `readonly` | readonly `string`[] | `undefined` | The kinds the dispatcher knows about. | - | - | [packages/security/src/sandbox/errors.ts:31](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/errors.ts#L31) |
| <a id="property-cause"></a> `cause?` | `public` | `unknown` | `undefined` | - | - | [`GraphorinSandboxError`](/api/@graphorin/security/classes/GraphorinSandboxError.md).[`cause`](/api/@graphorin/security/classes/GraphorinSandboxError.md#property-cause) | [node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.es2022.error.d.ts:26](https://github.com/o-stepper/graphorin/blob/main/node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2022.error.d.ts#L26) |
| <a id="property-hint"></a> `hint?` | `readonly` | `string` | `undefined` | Optional remediation hint (CLI command or doc link). | - | [`GraphorinSandboxError`](/api/@graphorin/security/classes/GraphorinSandboxError.md).[`hint`](/api/@graphorin/security/classes/GraphorinSandboxError.md#property-hint) | [packages/security/src/secrets/errors.ts:21](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/errors.ts#L21) |
| <a id="property-kind"></a> `kind` | `readonly` | `"unsupported-sandbox-kind"` | `'unsupported-sandbox-kind'` | Stable lowercase discriminator. Subclasses fix this to a literal. | [`GraphorinSandboxError`](/api/@graphorin/security/classes/GraphorinSandboxError.md).[`kind`](/api/@graphorin/security/classes/GraphorinSandboxError.md#property-kind) | - | [packages/security/src/sandbox/errors.ts:27](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/errors.ts#L27) |
| <a id="property-message"></a> `message` | `public` | `string` | `undefined` | - | - | [`GraphorinSandboxError`](/api/@graphorin/security/classes/GraphorinSandboxError.md).[`message`](/api/@graphorin/security/classes/GraphorinSandboxError.md#property-message) | [node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.es5.d.ts:1077](https://github.com/o-stepper/graphorin/blob/main/node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es5.d.ts#L1077) |
| <a id="property-name"></a> `name` | `public` | `string` | `undefined` | - | - | [`GraphorinSandboxError`](/api/@graphorin/security/classes/GraphorinSandboxError.md).[`name`](/api/@graphorin/security/classes/GraphorinSandboxError.md#property-name) | [node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.es5.d.ts:1076](https://github.com/o-stepper/graphorin/blob/main/node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es5.d.ts#L1076) |
| <a id="property-requested"></a> `requested` | `readonly` | `string` | `undefined` | The kind the dispatcher could not satisfy. | - | - | [packages/security/src/sandbox/errors.ts:29](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/errors.ts#L29) |
| <a id="property-stack"></a> `stack?` | `public` | `string` | `undefined` | - | - | [`GraphorinSandboxError`](/api/@graphorin/security/classes/GraphorinSandboxError.md).[`stack`](/api/@graphorin/security/classes/GraphorinSandboxError.md#property-stack) | [node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.es5.d.ts:1078](https://github.com/o-stepper/graphorin/blob/main/node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es5.d.ts#L1078) |
| <a id="property-stacktracelimit"></a> `stackTraceLimit` | `static` | `number` | `undefined` | The `Error.stackTraceLimit` property specifies the number of stack frames collected by a stack trace (whether generated by `new Error().stack` or `Error.captureStackTrace(obj)`). The default value is `10` but may be set to any valid JavaScript number. Changes will affect any stack trace captured _after_ the value has been changed. If set to a non-number value, or set to a negative number, stack traces will not capture any frames. | - | [`GraphorinSandboxError`](/api/@graphorin/security/classes/GraphorinSandboxError.md).[`stackTraceLimit`](/api/@graphorin/security/classes/GraphorinSandboxError.md#property-stacktracelimit) | [node\_modules/.pnpm/@types+node@22.19.17/node\_modules/@types/node/globals.d.ts:68](https://github.com/o-stepper/graphorin/blob/main/node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/globals.d.ts#L68) |

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

[`GraphorinSandboxError`](/api/@graphorin/security/classes/GraphorinSandboxError.md).[`captureStackTrace`](/api/@graphorin/security/classes/GraphorinSandboxError.md#capturestacktrace)

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

[`GraphorinSandboxError`](/api/@graphorin/security/classes/GraphorinSandboxError.md).[`prepareStackTrace`](/api/@graphorin/security/classes/GraphorinSandboxError.md#preparestacktrace)
