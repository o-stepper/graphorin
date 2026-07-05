[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / runTokenRekey

# Function: runTokenRekey()

```ts
function runTokenRekey(options?): Promise<readonly {
  newId: string;
  oldId: string;
  raw: string;
}[]>;
```

Defined in: packages/cli/src/commands/token.ts:253

Re-issue every active token. Used after a known compromise.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`TokenRekeyOptions`](/api/@graphorin/cli/interfaces/TokenRekeyOptions.md) |

## Returns

`Promise`\<readonly \{
  `newId`: `string`;
  `oldId`: `string`;
  `raw`: `string`;
\}[]\>

## Stable
