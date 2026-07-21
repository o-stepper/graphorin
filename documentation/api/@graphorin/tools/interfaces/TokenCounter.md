[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / TokenCounter

# Interface: TokenCounter

Defined in: packages/tools/src/result/truncate.ts:29

**`Stable`**

Pluggable token counter used by the truncation pipeline. Defaults
to [countTokensHeuristic](/api/@graphorin/tools/variables/countTokensHeuristic.md) (4 chars per token) when no custom
counter is supplied; the agent runtime injects the per-provider
counter from `@graphorin/provider/counters`.

## Methods

### count()

```ts
count(text): number;
```

Defined in: packages/tools/src/result/truncate.ts:30

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |

#### Returns

`number`
