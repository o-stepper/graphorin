[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / runStart

# Function: runStart()

```ts
function runStart(options?): Promise<{
  host: string;
  port: number;
}>;
```

Defined in: packages/cli/src/commands/start.ts:55

**`Stable`**

Programmatic entry - used both by the CLI binary and by tests so
the spawn cost of running the binary is paid only when an operator
actually invokes `graphorin start` from a shell.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`StartCommandOptions`](/api/@graphorin/cli/interfaces/StartCommandOptions.md) |

## Returns

`Promise`\<\{
  `host`: `string`;
  `port`: `number`;
\}\>
