[**Graphorin API reference v0.12.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [errors](/api/@graphorin/mcp/errors/index.md) / MCPToolExecutionError

# Class: MCPToolExecutionError

Defined in: [packages/mcp/src/errors/index.ts:112](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/errors/index.ts#L112)

Raised when the MCP server reports a tool-level failure
(`CallToolResult.isError === true`, MC-4). The server's content text
rides in the message so the model keeps its self-correction signal -
while the executor records a real tool FAILURE (audit, retry and
error policies all engage) instead of a fake success.

## Extends

- [`GraphorinMCPError`](/api/@graphorin/mcp/errors/classes/GraphorinMCPError.md)

## Constructors

### Constructor

```ts
new MCPToolExecutionError(message, opts?): MCPToolExecutionError;
```

Defined in: [packages/mcp/src/errors/index.ts:60](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/errors/index.ts#L60)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `message` | `string` |
| `opts` | \{ `cause?`: `unknown`; `hint?`: `string`; `metadata?`: [`MCPErrorMetadata`](/api/@graphorin/mcp/errors/interfaces/MCPErrorMetadata.md); \} |
| `opts.cause?` | `unknown` |
| `opts.hint?` | `string` |
| `opts.metadata?` | [`MCPErrorMetadata`](/api/@graphorin/mcp/errors/interfaces/MCPErrorMetadata.md) |

#### Returns

`MCPToolExecutionError`

#### Inherited from

[`GraphorinMCPError`](/api/@graphorin/mcp/errors/classes/GraphorinMCPError.md).[`constructor`](/api/@graphorin/mcp/errors/classes/GraphorinMCPError.md#constructor)

## Properties

| Property | Modifier | Type | Description | Overrides | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-cause"></a> `cause?` | `readonly` | `unknown` | Underlying cause (chained errors). | - | [`GraphorinMCPError`](/api/@graphorin/mcp/errors/classes/GraphorinMCPError.md).[`cause`](/api/@graphorin/mcp/errors/classes/GraphorinMCPError.md#property-cause) | [packages/mcp/src/errors/index.ts:58](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/errors/index.ts#L58) |
| <a id="property-hint"></a> `hint?` | `readonly` | `string` | Optional remediation hint surfaced in CLI output. | - | [`GraphorinMCPError`](/api/@graphorin/mcp/errors/classes/GraphorinMCPError.md).[`hint`](/api/@graphorin/mcp/errors/classes/GraphorinMCPError.md#property-hint) | [packages/mcp/src/errors/index.ts:54](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/errors/index.ts#L54) |
| <a id="property-kind"></a> `kind` | `readonly` | `"tool-execution"` | Lowercase discriminator. | [`GraphorinMCPError`](/api/@graphorin/mcp/errors/classes/GraphorinMCPError.md).[`kind`](/api/@graphorin/mcp/errors/classes/GraphorinMCPError.md#property-kind) | - | [packages/mcp/src/errors/index.ts:113](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/errors/index.ts#L113) |
| <a id="property-message"></a> `message` | `public` | `string` | - | - | [`GraphorinMCPError`](/api/@graphorin/mcp/errors/classes/GraphorinMCPError.md).[`message`](/api/@graphorin/mcp/errors/classes/GraphorinMCPError.md#property-message) | [node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.es5.d.ts:1077](https://github.com/o-stepper/graphorin/blob/main/node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es5.d.ts#L1077) |
| <a id="property-metadata"></a> `metadata` | `readonly` | `Readonly`\&lt;[`MCPErrorMetadata`](/api/@graphorin/mcp/errors/interfaces/MCPErrorMetadata.md)\&gt; | Sanitized metadata; never carries secret material. | - | [`GraphorinMCPError`](/api/@graphorin/mcp/errors/classes/GraphorinMCPError.md).[`metadata`](/api/@graphorin/mcp/errors/classes/GraphorinMCPError.md#property-metadata) | [packages/mcp/src/errors/index.ts:56](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/errors/index.ts#L56) |
| <a id="property-name"></a> `name` | `public` | `string` | - | - | [`GraphorinMCPError`](/api/@graphorin/mcp/errors/classes/GraphorinMCPError.md).[`name`](/api/@graphorin/mcp/errors/classes/GraphorinMCPError.md#property-name) | [node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.es5.d.ts:1076](https://github.com/o-stepper/graphorin/blob/main/node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es5.d.ts#L1076) |
| <a id="property-stack"></a> `stack?` | `public` | `string` | - | - | [`GraphorinMCPError`](/api/@graphorin/mcp/errors/classes/GraphorinMCPError.md).[`stack`](/api/@graphorin/mcp/errors/classes/GraphorinMCPError.md#property-stack) | [node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.es5.d.ts:1078](https://github.com/o-stepper/graphorin/blob/main/node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es5.d.ts#L1078) |
| <a id="property-stacktracelimit"></a> `stackTraceLimit` | `static` | `number` | The `Error.stackTraceLimit` property specifies the number of stack frames collected by a stack trace (whether generated by `new Error().stack` or `Error.captureStackTrace(obj)`). The default value is `10` but may be set to any valid JavaScript number. Changes will affect any stack trace captured _after_ the value has been changed. If set to a non-number value, or set to a negative number, stack traces will not capture any frames. | - | [`GraphorinMCPError`](/api/@graphorin/mcp/errors/classes/GraphorinMCPError.md).[`stackTraceLimit`](/api/@graphorin/mcp/errors/classes/GraphorinMCPError.md#property-stacktracelimit) | [node\_modules/.pnpm/@types+node@22.19.17/node\_modules/@types/node/globals.d.ts:68](https://github.com/o-stepper/graphorin/blob/main/node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/globals.d.ts#L68) |

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

[`GraphorinMCPError`](/api/@graphorin/mcp/errors/classes/GraphorinMCPError.md).[`captureStackTrace`](/api/@graphorin/mcp/errors/classes/GraphorinMCPError.md#capturestacktrace)

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

[`GraphorinMCPError`](/api/@graphorin/mcp/errors/classes/GraphorinMCPError.md).[`prepareStackTrace`](/api/@graphorin/mcp/errors/classes/GraphorinMCPError.md#preparestacktrace)
