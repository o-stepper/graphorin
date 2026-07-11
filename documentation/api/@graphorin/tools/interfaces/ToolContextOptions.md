[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / ToolContextOptions

# Interface: ToolContextOptions\&lt;TDeps\&gt;

Defined in: [packages/tools/src/executor/tool-context.ts:46](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/executor/tool-context.ts#L46)

Configuration for [buildToolExecutionContext](/api/@graphorin/tools/functions/buildToolExecutionContext.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TDeps` | `unknown` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-logger"></a> `logger?` | `readonly` | [`Logger`](/api/@graphorin/core/interfaces/Logger.md) | - | [packages/tools/src/executor/tool-context.ts:53](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/executor/tool-context.ts#L53) |
| <a id="property-runcontext"></a> `runContext` | `readonly` | [`RunContext`](/api/@graphorin/core/interfaces/RunContext.md)\&lt;`TDeps`\&gt; | - | [packages/tools/src/executor/tool-context.ts:49](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/executor/tool-context.ts#L49) |
| <a id="property-secretresolver"></a> `secretResolver?` | `readonly` | `SecretResolverHook` | The secrets resolver injected by the agent runtime. | [packages/tools/src/executor/tool-context.ts:55](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/executor/tool-context.ts#L55) |
| <a id="property-signal"></a> `signal` | `readonly` | `AbortSignal` | - | [packages/tools/src/executor/tool-context.ts:50](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/executor/tool-context.ts#L50) |
| <a id="property-streamingchannel"></a> `streamingChannel` | `readonly` | [`StreamingChannel`](/api/@graphorin/tools/interfaces/StreamingChannel.md) | - | [packages/tools/src/executor/tool-context.ts:51](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/executor/tool-context.ts#L51) |
| <a id="property-tool"></a> `tool` | `readonly` | [`ResolvedTool`](/api/@graphorin/core/interfaces/ResolvedTool.md)\&lt;`unknown`, `unknown`, `TDeps`\&gt; | - | [packages/tools/src/executor/tool-context.ts:47](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/executor/tool-context.ts#L47) |
| <a id="property-toolcallid"></a> `toolCallId` | `readonly` | `string` | - | [packages/tools/src/executor/tool-context.ts:48](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/executor/tool-context.ts#L48) |
| <a id="property-tracer"></a> `tracer?` | `readonly` | [`Tracer`](/api/@graphorin/core/interfaces/Tracer.md) | - | [packages/tools/src/executor/tool-context.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/executor/tool-context.ts#L52) |
