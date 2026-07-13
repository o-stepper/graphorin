[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ToolExecutionContext

# Interface: ToolExecutionContext\&lt;TDeps\&gt;

Defined in: [packages/core/src/contracts/tool.ts:345](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/tool.ts#L345)

Per-call execution context handed to `Tool.execute(...)`. Carries the
stable `toolCallId`, the parent `RunContext`, an `AbortSignal` tied to
the surrounding agent run, structured tracer / logger handles, the
streaming progress / content emitters, and a per-call secrets accessor
scoped to the tool's `secretsAllowed` ACL.

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TDeps` | `unknown` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-logger"></a> `logger` | `readonly` | [`Logger`](/api/@graphorin/core/interfaces/Logger.md) | - | [packages/core/src/contracts/tool.ts:350](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/tool.ts#L350) |
| <a id="property-runcontext"></a> `runContext` | `readonly` | [`RunContext`](/api/@graphorin/core/interfaces/RunContext.md)\&lt;`TDeps`\&gt; | - | [packages/core/src/contracts/tool.ts:347](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/tool.ts#L347) |
| <a id="property-secrets"></a> `secrets` | `readonly` | [`ToolSecretsAccessor`](/api/@graphorin/core/interfaces/ToolSecretsAccessor.md) | Per-call secrets accessor. The accessor enforces the tool's `secretsAllowed` ACL - calling `require(...)` for a key that is not on the allowlist throws `SecretAccessDeniedError`. | [packages/core/src/contracts/tool.ts:356](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/tool.ts#L356) |
| <a id="property-signal"></a> `signal` | `readonly` | `AbortSignal` | - | [packages/core/src/contracts/tool.ts:348](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/tool.ts#L348) |
| <a id="property-toolcallid"></a> `toolCallId` | `readonly` | `string` | - | [packages/core/src/contracts/tool.ts:346](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/tool.ts#L346) |
| <a id="property-tracer"></a> `tracer` | `readonly` | [`Tracer`](/api/@graphorin/core/interfaces/Tracer.md) | - | [packages/core/src/contracts/tool.ts:349](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/tool.ts#L349) |

## Methods

### reportProgress()

```ts
reportProgress(
   current, 
   total?, 
   message?): void;
```

Defined in: [packages/core/src/contracts/tool.ts:363](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/tool.ts#L363)

Emit a progress event to subscribers of `agent.stream(...)`. No-op
on tools without `streamingHint: true` AND on aborted streams. The
counter pair `(current, total?)` is consumer-rendered as a
percentage when both fields are present.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `current` | `number` |
| `total?` | `number` |
| `message?` | `string` |

#### Returns

`void`

***

### streamContent()

```ts
streamContent(chunk): void;
```

Defined in: [packages/core/src/contracts/tool.ts:369](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/tool.ts#L369)

Emit one chunk of content. Concatenated into the tool's assembled
`output` per the buffer-becomes-output discipline. No-op on tools
without `streamingHint: true` AND on aborted streams.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `chunk` | [`ContentChunk`](/api/@graphorin/core/type-aliases/ContentChunk.md) |

#### Returns

`void`
