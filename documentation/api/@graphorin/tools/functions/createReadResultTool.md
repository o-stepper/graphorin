[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / createReadResultTool

# Function: createReadResultTool()

```ts
function createReadResultTool(opts): Tool<{
  endLine?: number;
  handle: string;
  length?: number;
  maxBytes?: number;
  offset?: number;
  startLine?: number;
}, {
  bytes: number;
  content: string;
  eof: boolean;
  totalBytes: number;
}>;
```

Defined in: packages/tools/src/built-in/read-result.ts:55

Build a `read_result` tool bound to a specific [ResultReader](/api/@graphorin/tools/interfaces/ResultReader.md).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`ReadResultToolOptions`](/api/@graphorin/tools/interfaces/ReadResultToolOptions.md) |

## Returns

[`Tool`](/api/@graphorin/core/interfaces/Tool.md)\<\{
  `endLine?`: `number`;
  `handle`: `string`;
  `length?`: `number`;
  `maxBytes?`: `number`;
  `offset?`: `number`;
  `startLine?`: `number`;
\}, \{
  `bytes`: `number`;
  `content`: `string`;
  `eof`: `boolean`;
  `totalBytes`: `number`;
\}\>

## Stable
