[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / ToolRepairHook

# Interface: ToolRepairHook

Defined in: packages/tools/src/executor/types.ts:45

Optional repair hook for invalid LLM-generated tool args.

## Methods

### repair()

```ts
repair(opts): Promise<unknown>;
```

Defined in: packages/tools/src/executor/types.ts:46

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | \{ `invalidArgs`: `unknown`; `schemaError`: `unknown`; `signal`: `AbortSignal`; `toolName`: `string`; \} |
| `opts.invalidArgs` | `unknown` |
| `opts.schemaError` | `unknown` |
| `opts.signal` | `AbortSignal` |
| `opts.toolName` | `string` |

#### Returns

`Promise`\&lt;`unknown`\&gt;
