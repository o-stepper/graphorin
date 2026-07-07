[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / BudgetExceededError

# Class: BudgetExceededError

Defined in: [packages/memory/src/consolidator/errors.ts:18](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/errors.ts#L18)

Raised when the consolidator's daily budget envelope is exhausted
and `onExceed: 'throw'` is in effect.

## Stable

## Extends

- [`GraphorinMemoryError`](/api/@graphorin/memory/errors/classes/GraphorinMemoryError.md)

## Constructors

### Constructor

```ts
new BudgetExceededError(args): BudgetExceededError;
```

Defined in: [packages/memory/src/consolidator/errors.ts:26](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/errors.ts#L26)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | \{ `actual`: `number`; `budget`: `number`; `phase`: [`ConsolidatorPhase`](/api/@graphorin/memory/type-aliases/ConsolidatorPhase.md); `resource`: `"tokens"` \| `"cost"`; \} |
| `args.actual` | `number` |
| `args.budget` | `number` |
| `args.phase` | [`ConsolidatorPhase`](/api/@graphorin/memory/type-aliases/ConsolidatorPhase.md) |
| `args.resource` | `"tokens"` \| `"cost"` |

#### Returns

`BudgetExceededError`

#### Overrides

[`GraphorinMemoryError`](/api/@graphorin/memory/errors/classes/GraphorinMemoryError.md).[`constructor`](/api/@graphorin/memory/errors/classes/GraphorinMemoryError.md#constructor)

## Properties

| Property | Modifier | Type | Default value | Description | Overrides | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-actual"></a> `actual` | `readonly` | `number` | `undefined` | - | - | - | [packages/memory/src/consolidator/errors.ts:23](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/errors.ts#L23) |
| <a id="property-budget"></a> `budget` | `readonly` | `number` | `undefined` | - | - | - | [packages/memory/src/consolidator/errors.ts:22](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/errors.ts#L22) |
| <a id="property-cause"></a> `cause?` | `public` | `unknown` | `undefined` | - | - | [`GraphorinMemoryError`](/api/@graphorin/memory/errors/classes/GraphorinMemoryError.md).[`cause`](/api/@graphorin/memory/errors/classes/GraphorinMemoryError.md#property-cause) | [node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.es2022.error.d.ts:26](https://github.com/o-stepper/graphorin/blob/main/node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2022.error.d.ts#L26) |
| <a id="property-hint"></a> `hint?` | `readonly` | `string` | `undefined` | Optional actionable hint surfaced to operators. | - | [`GraphorinMemoryError`](/api/@graphorin/memory/errors/classes/GraphorinMemoryError.md).[`hint`](/api/@graphorin/memory/errors/classes/GraphorinMemoryError.md#property-hint) | [packages/memory/src/errors/index.ts:20](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/errors/index.ts#L20) |
| <a id="property-kind"></a> `kind` | `readonly` | `"budget-exceeded"` | `undefined` | Stable lowercase discriminator. | [`GraphorinMemoryError`](/api/@graphorin/memory/errors/classes/GraphorinMemoryError.md).[`kind`](/api/@graphorin/memory/errors/classes/GraphorinMemoryError.md#property-kind) | - | [packages/memory/src/consolidator/errors.ts:20](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/errors.ts#L20) |
| <a id="property-message"></a> `message` | `public` | `string` | `undefined` | - | - | [`GraphorinMemoryError`](/api/@graphorin/memory/errors/classes/GraphorinMemoryError.md).[`message`](/api/@graphorin/memory/errors/classes/GraphorinMemoryError.md#property-message) | [node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.es5.d.ts:1077](https://github.com/o-stepper/graphorin/blob/main/node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es5.d.ts#L1077) |
| <a id="property-name"></a> `name` | `readonly` | `"BudgetExceededError"` | `'BudgetExceededError'` | - | [`GraphorinMemoryError`](/api/@graphorin/memory/errors/classes/GraphorinMemoryError.md).[`name`](/api/@graphorin/memory/errors/classes/GraphorinMemoryError.md#property-name) | - | [packages/memory/src/consolidator/errors.ts:19](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/errors.ts#L19) |
| <a id="property-phase"></a> `phase` | `readonly` | [`ConsolidatorPhase`](/api/@graphorin/memory/type-aliases/ConsolidatorPhase.md) | `undefined` | - | - | - | [packages/memory/src/consolidator/errors.ts:21](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/errors.ts#L21) |
| <a id="property-resource"></a> `resource` | `readonly` | `"tokens"` \| `"cost"` | `undefined` | - | - | - | [packages/memory/src/consolidator/errors.ts:24](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/errors.ts#L24) |
| <a id="property-stack"></a> `stack?` | `public` | `string` | `undefined` | - | - | [`GraphorinMemoryError`](/api/@graphorin/memory/errors/classes/GraphorinMemoryError.md).[`stack`](/api/@graphorin/memory/errors/classes/GraphorinMemoryError.md#property-stack) | [node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.es5.d.ts:1078](https://github.com/o-stepper/graphorin/blob/main/node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es5.d.ts#L1078) |
| <a id="property-stacktracelimit"></a> `stackTraceLimit` | `static` | `number` | `undefined` | The `Error.stackTraceLimit` property specifies the number of stack frames collected by a stack trace (whether generated by `new Error().stack` or `Error.captureStackTrace(obj)`). The default value is `10` but may be set to any valid JavaScript number. Changes will affect any stack trace captured _after_ the value has been changed. If set to a non-number value, or set to a negative number, stack traces will not capture any frames. | - | [`GraphorinMemoryError`](/api/@graphorin/memory/errors/classes/GraphorinMemoryError.md).[`stackTraceLimit`](/api/@graphorin/memory/errors/classes/GraphorinMemoryError.md#property-stacktracelimit) | [node\_modules/.pnpm/@types+node@22.19.17/node\_modules/@types/node/globals.d.ts:68](https://github.com/o-stepper/graphorin/blob/main/node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/globals.d.ts#L68) |

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

[`GraphorinMemoryError`](/api/@graphorin/memory/errors/classes/GraphorinMemoryError.md).[`captureStackTrace`](/api/@graphorin/memory/errors/classes/GraphorinMemoryError.md#capturestacktrace)

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

[`GraphorinMemoryError`](/api/@graphorin/memory/errors/classes/GraphorinMemoryError.md).[`prepareStackTrace`](/api/@graphorin/memory/errors/classes/GraphorinMemoryError.md#preparestacktrace)
