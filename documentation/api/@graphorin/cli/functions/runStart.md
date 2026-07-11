[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / runStart

# Function: runStart()

```ts
function runStart(options?): Promise<{
  host: string;
  port: number;
}>;
```

Defined in: [packages/cli/src/commands/start.ts:54](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/start.ts#L54)

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

## Stable
