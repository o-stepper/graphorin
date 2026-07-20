[**Graphorin API reference v0.13.6**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [progress](/api/@graphorin/agent/progress/index.md) / ProgressIO

# Interface: ProgressIO

Defined in: packages/agent/src/progress/index.ts:79

**`Stable`**

Public surface returned by [createProgressIO](/api/@graphorin/agent/progress/functions/createProgressIO.md). Used by the
agent runtime to back `agent.progress.write / read`.

## Methods

### read()

```ts
read(currentRunId, options?): Promise<readonly ProgressArtifactRef[]>;
```

Defined in: packages/agent/src/progress/index.ts:85

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `currentRunId` | `string` |
| `options?` | [`ProgressReadOptions`](/api/@graphorin/agent/progress/interfaces/ProgressReadOptions.md) |

#### Returns

`Promise`\&lt;readonly [`ProgressArtifactRef`](/api/@graphorin/core/interfaces/ProgressArtifactRef.md)[]\&gt;

***

### rootFor()

```ts
rootFor(runId): string;
```

Defined in: packages/agent/src/progress/index.ts:89

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `runId` | `string` |

#### Returns

`string`

***

### write()

```ts
write(
   runId, 
   content, 
options?): Promise<ProgressArtifactRef>;
```

Defined in: packages/agent/src/progress/index.ts:80

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `runId` | `string` |
| `content` | `string` |
| `options?` | [`ProgressWriteOptions`](/api/@graphorin/agent/progress/interfaces/ProgressWriteOptions.md) |

#### Returns

`Promise`\&lt;[`ProgressArtifactRef`](/api/@graphorin/core/interfaces/ProgressArtifactRef.md)\&gt;
