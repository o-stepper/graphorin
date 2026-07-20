[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / ToolCassetteWriter

# Interface: ToolCassetteWriter

Defined in: packages/sessions/src/cassette/writer.ts:53

**`Stable`**

Writer surface returned by [createToolCassetteWriter](/api/@graphorin/sessions/functions/createToolCassetteWriter.md). Call
`writeRecord(...)` per body record (any order, but `meta` and
`footer` are owned by the writer) and `close()` to emit the footer.

## Methods

### close()

```ts
close(): Promise<ToolCassetteFooterRecord>;
```

Defined in: packages/sessions/src/cassette/writer.ts:55

#### Returns

`Promise`\&lt;[`ToolCassetteFooterRecord`](/api/@graphorin/sessions/interfaces/ToolCassetteFooterRecord.md)\&gt;

***

### writeRecord()

```ts
writeRecord(record): Promise<void>;
```

Defined in: packages/sessions/src/cassette/writer.ts:54

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `record` | [`ToolCassetteRecord`](/api/@graphorin/sessions/type-aliases/ToolCassetteRecord.md) |

#### Returns

`Promise`\&lt;`void`\&gt;
