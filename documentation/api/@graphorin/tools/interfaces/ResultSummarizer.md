[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / ResultSummarizer

# Interface: ResultSummarizer

Defined in: packages/tools/src/result/truncate.ts:96

**`Stable`**

Pluggable summarizer hook - the agent runtime supplies an
implementation backed by the consolidator-tier model. When absent
the `'summarize'` strategy gracefully degrades to `'middle'` and
records the fall-through on the outcome.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-model"></a> `model` | `readonly` | `string` | packages/tools/src/result/truncate.ts:97 |

## Methods

### summarize()

```ts
summarize(body, opts): Promise<string>;
```

Defined in: packages/tools/src/result/truncate.ts:98

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `body` | `string` |
| `opts` | \{ `maxTokens`: `number`; `signal?`: `AbortSignal`; \} |
| `opts.maxTokens` | `number` |
| `opts.signal?` | `AbortSignal` |

#### Returns

`Promise`\&lt;`string`\&gt;
