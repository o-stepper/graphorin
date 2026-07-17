[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / truncateToTokens

# Function: truncateToTokens()

```ts
function truncateToTokens(
   text, 
   maxTokens, 
   counter): Promise<{
  text: string;
  tokens: number;
  truncated: boolean;
}>;
```

Defined in: [packages/memory/src/context-engine/token-budget.ts:155](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/token-budget.ts#L155)

Truncate `text` to fit `maxTokens`, preserving the leading
portion and replacing the trailing portion with the literal
`[...truncated]` marker. The token estimate is computed via the
supplied `counter`; truncation falls back to character-based
trimming when the estimate is non-monotonic.

Structure-aware (CE-16e): the cut never splits a tag, and block
tags the cut leaves open are re-closed after the marker, so a
capped layer of XML-ish markup (e.g. `<memory_blocks>`) stays
well-formed in the assembled prompt. Plain strings are unaffected.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |
| `maxTokens` | `number` |
| `counter` | [`ContextTokenCounter`](/api/@graphorin/memory/interfaces/ContextTokenCounter.md) |

## Returns

`Promise`\<\{
  `text`: `string`;
  `tokens`: `number`;
  `truncated`: `boolean`;
\}\>

## Stable
