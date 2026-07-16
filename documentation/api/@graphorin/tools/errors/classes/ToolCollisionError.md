[**Graphorin API reference v0.10.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [errors](/api/@graphorin/tools/errors/index.md) / ToolCollisionError

# Class: ToolCollisionError

Defined in: [packages/tools/src/errors/index.ts:174](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/errors/index.ts#L174)

Thrown by the strategy-aware `ToolRegistry.assertNoDuplicates(...)`
overload when the operator selected the `'manual'` strategy and the
dispatcher has no automatic resolution path.

## Stable

## Extends

- [`GraphorinToolsError`](/api/@graphorin/tools/errors/classes/GraphorinToolsError.md)

## Constructors

### Constructor

```ts
new ToolCollisionError(opts): ToolCollisionError;
```

Defined in: [packages/tools/src/errors/index.ts:178](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/errors/index.ts#L178)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | \{ `conflictingSources`: readonly `string`[]; `resolutionOptions`: readonly `string`[]; `strategyAttempted`: `string`; `toolName`: `string`; \} |
| `opts.conflictingSources` | readonly `string`[] |
| `opts.resolutionOptions` | readonly `string`[] |
| `opts.strategyAttempted` | `string` |
| `opts.toolName` | `string` |

#### Returns

`ToolCollisionError`

#### Overrides

[`GraphorinToolsError`](/api/@graphorin/tools/errors/classes/GraphorinToolsError.md).[`constructor`](/api/@graphorin/tools/errors/classes/GraphorinToolsError.md#constructor)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-cause"></a> `cause?` | `readonly` | `unknown` | - | [`GraphorinToolsError`](/api/@graphorin/tools/errors/classes/GraphorinToolsError.md).[`cause`](/api/@graphorin/tools/errors/classes/GraphorinToolsError.md#property-cause) | [packages/tools/src/errors/index.ts:20](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/errors/index.ts#L20) |
| <a id="property-conflictingsources"></a> `conflictingSources` | `readonly` | readonly `string`[] | - | - | [packages/tools/src/errors/index.ts:176](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/errors/index.ts#L176) |
| <a id="property-hint"></a> `hint?` | `readonly` | `string` | - | [`GraphorinToolsError`](/api/@graphorin/tools/errors/classes/GraphorinToolsError.md).[`hint`](/api/@graphorin/tools/errors/classes/GraphorinToolsError.md#property-hint) | [packages/tools/src/errors/index.ts:19](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/errors/index.ts#L19) |
| <a id="property-kind"></a> `kind` | `readonly` | `string` | - | [`GraphorinToolsError`](/api/@graphorin/tools/errors/classes/GraphorinToolsError.md).[`kind`](/api/@graphorin/tools/errors/classes/GraphorinToolsError.md#property-kind) | [packages/tools/src/errors/index.ts:18](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/errors/index.ts#L18) |
| <a id="property-message"></a> `message` | `public` | `string` | - | [`GraphorinToolsError`](/api/@graphorin/tools/errors/classes/GraphorinToolsError.md).[`message`](/api/@graphorin/tools/errors/classes/GraphorinToolsError.md#property-message) | [node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.es5.d.ts:1077](https://github.com/o-stepper/graphorin/blob/main/node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es5.d.ts#L1077) |
| <a id="property-name"></a> `name` | `public` | `string` | - | [`GraphorinToolsError`](/api/@graphorin/tools/errors/classes/GraphorinToolsError.md).[`name`](/api/@graphorin/tools/errors/classes/GraphorinToolsError.md#property-name) | [node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.es5.d.ts:1076](https://github.com/o-stepper/graphorin/blob/main/node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es5.d.ts#L1076) |
| <a id="property-stack"></a> `stack?` | `public` | `string` | - | [`GraphorinToolsError`](/api/@graphorin/tools/errors/classes/GraphorinToolsError.md).[`stack`](/api/@graphorin/tools/errors/classes/GraphorinToolsError.md#property-stack) | [node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.es5.d.ts:1078](https://github.com/o-stepper/graphorin/blob/main/node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es5.d.ts#L1078) |
| <a id="property-strategyattempted"></a> `strategyAttempted` | `readonly` | `string` | - | - | [packages/tools/src/errors/index.ts:177](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/errors/index.ts#L177) |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | - | - | [packages/tools/src/errors/index.ts:175](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/errors/index.ts#L175) |
| <a id="property-stacktracelimit"></a> `stackTraceLimit` | `static` | `number` | The `Error.stackTraceLimit` property specifies the number of stack frames collected by a stack trace (whether generated by `new Error().stack` or `Error.captureStackTrace(obj)`). The default value is `10` but may be set to any valid JavaScript number. Changes will affect any stack trace captured _after_ the value has been changed. If set to a non-number value, or set to a negative number, stack traces will not capture any frames. | [`GraphorinToolsError`](/api/@graphorin/tools/errors/classes/GraphorinToolsError.md).[`stackTraceLimit`](/api/@graphorin/tools/errors/classes/GraphorinToolsError.md#property-stacktracelimit) | [node\_modules/.pnpm/@types+node@22.19.17/node\_modules/@types/node/globals.d.ts:68](https://github.com/o-stepper/graphorin/blob/main/node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/globals.d.ts#L68) |

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

[`GraphorinToolsError`](/api/@graphorin/tools/errors/classes/GraphorinToolsError.md).[`captureStackTrace`](/api/@graphorin/tools/errors/classes/GraphorinToolsError.md#capturestacktrace)

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

[`GraphorinToolsError`](/api/@graphorin/tools/errors/classes/GraphorinToolsError.md).[`prepareStackTrace`](/api/@graphorin/tools/errors/classes/GraphorinToolsError.md#preparestacktrace)
