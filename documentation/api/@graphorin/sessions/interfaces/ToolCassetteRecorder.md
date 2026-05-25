[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / ToolCassetteRecorder

# Interface: ToolCassetteRecorder

Defined in: packages/sessions/src/cassette/recorder.ts:52

Surface returned by [createToolCassetteRecorder](/api/@graphorin/sessions/functions/createToolCassetteRecorder.md). The
recorder is async-only — every event the runtime drains is a
Promise so backpressure does not block the agent loop.

## Stable

## Methods

### close()

```ts
close(): Promise<ToolCassetteFooterRecord>;
```

Defined in: packages/sessions/src/cassette/recorder.ts:68

Close the cassette + return the footer. Idempotent.

#### Returns

`Promise`\&lt;[`ToolCassetteFooterRecord`](/api/@graphorin/sessions/interfaces/ToolCassetteFooterRecord.md)\&gt;

***

### flushToFile()

```ts
flushToFile(): Promise<{
  path: string;
  recordCount: number;
  sha256: string;
}>;
```

Defined in: packages/sessions/src/cassette/recorder.ts:73

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

Defined in: packages/sessions/src/cassette/recorder.ts:66

Record an `audit` chain segment.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `record` | `Omit`\&lt;[`CassetteAuditRecord`](/api/@graphorin/sessions/interfaces/CassetteAuditRecord.md), `"kind"`\&gt; |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### recordCompaction()

```ts
recordCompaction(record): Promise<void>;
```

Defined in: packages/sessions/src/cassette/recorder.ts:62

Record a `compaction` event.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `record` | `Omit`\&lt;[`CompactionRecord`](/api/@graphorin/sessions/interfaces/CompactionRecord.md), `"kind"`\&gt; |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### recordModelFallback()

```ts
recordModelFallback(record): Promise<void>;
```

Defined in: packages/sessions/src/cassette/recorder.ts:60

Record a `model-fallback` chain advance.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `record` | `Omit`\&lt;[`ModelFallbackRecord`](/api/@graphorin/sessions/interfaces/ModelFallbackRecord.md), `"kind"`\&gt; |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### recordProgressArtifactRef()

```ts
recordProgressArtifactRef(record): Promise<void>;
```

Defined in: packages/sessions/src/cassette/recorder.ts:64

Record a `progress-artifact-ref` spilled-artifact event.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `record` | `Omit`\&lt;[`ProgressArtifactRefRecord`](/api/@graphorin/sessions/interfaces/ProgressArtifactRefRecord.md), `"kind"`\&gt; |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### recordToolCall()

```ts
recordToolCall(record): Promise<void>;
```

Defined in: packages/sessions/src/cassette/recorder.ts:54

Record a `tool-call` event. Computes hashes lazily.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `record` | `Omit`\&lt;[`ToolCallRecord`](/api/@graphorin/sessions/interfaces/ToolCallRecord.md), `"kind"` \| `"sha256OfArgs"` \| `"sha256OfOutput"`\&gt; |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### recordToolSearchResolved()

```ts
recordToolSearchResolved(record): Promise<void>;
```

Defined in: packages/sessions/src/cassette/recorder.ts:58

Record a `tool-search-resolved` lazy-load event.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `record` | `Omit`\&lt;[`ToolSearchResolvedRecord`](/api/@graphorin/sessions/interfaces/ToolSearchResolvedRecord.md), `"kind"`\&gt; |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### toString()

```ts
toString(): string;
```

Defined in: packages/sessions/src/cassette/recorder.ts:79

Snapshot the buffered cassette body as a single string.

#### Returns

`string`
