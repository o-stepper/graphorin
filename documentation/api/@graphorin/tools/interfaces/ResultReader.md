[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / ResultReader

# Interface: ResultReader

Defined in: [packages/tools/src/result/reader.ts:89](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/result/reader.ts#L89)

Resolves result handles to (ranges of) their backing artifact.

## Stable

## Methods

### read()

```ts
read(uri, range?): Promise<ResultReadOutcome>;
```

Defined in: [packages/tools/src/result/reader.ts:90](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/result/reader.ts#L90)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `uri` | `string` |
| `range?` | [`ResultReadRange`](/api/@graphorin/tools/interfaces/ResultReadRange.md) |

#### Returns

`Promise`\&lt;[`ResultReadOutcome`](/api/@graphorin/tools/interfaces/ResultReadOutcome.md)\&gt;
