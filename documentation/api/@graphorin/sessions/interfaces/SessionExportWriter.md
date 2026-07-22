[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / SessionExportWriter

# Interface: SessionExportWriter

Defined in: packages/sessions/src/export/writer.ts:89

**`Stable`**

Streaming writer. Call `writeRecord(...)` per body record (in any
order, but `kind: 'meta'` and `kind: 'footer'` are owned by the
writer) and `close()` to emit the footer. The writer itself does
not own the destination - every emission is delivered via the
caller-supplied `sink`.

## Methods

### close()

```ts
close(): Promise<SessionExportFooterRecord>;
```

Defined in: packages/sessions/src/export/writer.ts:93

Emit the footer + any opt-in `--hash` body checksum. Idempotent.

#### Returns

`Promise`\&lt;[`SessionExportFooterRecord`](/api/@graphorin/sessions/interfaces/SessionExportFooterRecord.md)\&gt;

***

### writeRecord()

```ts
writeRecord(record): Promise<void>;
```

Defined in: packages/sessions/src/export/writer.ts:91

Write a single body record. The header is emitted lazily.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `record` | [`SessionExportRecord`](/api/@graphorin/sessions/type-aliases/SessionExportRecord.md) |

#### Returns

`Promise`\&lt;`void`\&gt;
