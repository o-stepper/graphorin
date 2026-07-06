[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / ToolCassetteRecorder

# Interface: ToolCassetteRecorder

Defined in: packages/sessions/src/cassette/recorder.ts:53

Surface returned by [createToolCassetteRecorder](/api/@graphorin/sessions/functions/createToolCassetteRecorder.md). The
recorder is async-only - every event the runtime drains is a
Promise so backpressure does not block the agent loop.

## Stable

## Methods

### close()

```ts
close(): Promise<ToolCassetteFooterRecord>;
```

Defined in: packages/sessions/src/cassette/recorder.ts:69

Close the cassette + return the footer. Idempotent.

#### Returns

`Promise`\<[`ToolCassetteFooterRecord`](/api/@graphorin/sessions/interfaces/ToolCassetteFooterRecord.md)\>

***

### flushToFile()

```ts
flushToFile(): Promise<{
  path: string;
  recordCount: number;
  sha256: string;
}>;
```

Defined in: packages/sessions/src/cassette/recorder.ts:74

Flush the cassette to the configured `outputPath`. Returns the
`{ path, recordCount, sha256 }` summary surfaced to the caller.

#### Returns

`Promise`\<\{
  `path`: `string`;
  `recordCount`: `number`;
  `sha256`: `string`;
\}\>

***

### recordAuditSegment()

```ts
recordAuditSegment(record): Promise<void>;
```

Defined in: packages/sessions/src/cassette/recorder.ts:67

Record an `audit` chain segment.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `record` | `Omit`\<[`CassetteAuditRecord`](/api/@graphorin/sessions/interfaces/CassetteAuditRecord.md), `"kind"`\> |

#### Returns

`Promise`\<`void`\>

***

### recordCompaction()

```ts
recordCompaction(record): Promise<void>;
```

Defined in: packages/sessions/src/cassette/recorder.ts:63

Record a `compaction` event.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `record` | `Omit`\<[`CompactionRecord`](/api/@graphorin/sessions/interfaces/CompactionRecord.md), `"kind"`\> |

#### Returns

`Promise`\<`void`\>

***

### recordModelFallback()

```ts
recordModelFallback(record): Promise<void>;
```

Defined in: packages/sessions/src/cassette/recorder.ts:61

Record a `model-fallback` chain advance.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `record` | `Omit`\<[`ModelFallbackRecord`](/api/@graphorin/sessions/interfaces/ModelFallbackRecord.md), `"kind"`\> |

#### Returns

`Promise`\<`void`\>

***

### recordProgressArtifactRef()

```ts
recordProgressArtifactRef(record): Promise<void>;
```

Defined in: packages/sessions/src/cassette/recorder.ts:65

Record a `progress-artifact-ref` spilled-artifact event.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `record` | `Omit`\<[`ProgressArtifactRefRecord`](/api/@graphorin/sessions/interfaces/ProgressArtifactRefRecord.md), `"kind"`\> |

#### Returns

`Promise`\<`void`\>

***

### recordToolCall()

```ts
recordToolCall(record): Promise<void>;
```

Defined in: packages/sessions/src/cassette/recorder.ts:55

Record a `tool-call` event. Computes hashes lazily.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `record` | `Omit`\<[`ToolCallRecord`](/api/@graphorin/sessions/interfaces/ToolCallRecord.md), `"kind"` \| `"sha256OfArgs"` \| `"sha256OfOutput"`\> |

#### Returns

`Promise`\<`void`\>

***

### recordToolSearchResolved()

```ts
recordToolSearchResolved(record): Promise<void>;
```

Defined in: packages/sessions/src/cassette/recorder.ts:59

Record a `tool-search-resolved` lazy-load event.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `record` | `Omit`\<[`ToolSearchResolvedRecord`](/api/@graphorin/sessions/interfaces/ToolSearchResolvedRecord.md), `"kind"`\> |

#### Returns

`Promise`\<`void`\>

***

### toString()

```ts
toString(): string;
```

Defined in: packages/sessions/src/cassette/recorder.ts:80

Snapshot the buffered cassette body as a single string.

#### Returns

`string`
