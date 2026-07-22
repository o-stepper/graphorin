[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / AgentProgressIO

# Interface: AgentProgressIO

Defined in: packages/agent/src/types.ts:837

**`Stable`**

Progress IO surface exposed on the `Agent` instance. The methods
default the `runId` cursor to the in-flight run when present, so
callers can use them inside an `agent.run(...)` boundary without
repeating the cursor.

## Methods

### read()

```ts
read(options?): Promise<readonly ProgressArtifactRef[]>;
```

Defined in: packages/agent/src/types.ts:839

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options?` | [`ProgressReadOptions`](/api/@graphorin/agent/progress/interfaces/ProgressReadOptions.md) |

#### Returns

`Promise`\&lt;readonly [`ProgressArtifactRef`](/api/@graphorin/core/interfaces/ProgressArtifactRef.md)[]\&gt;

***

### write()

```ts
write(content, options?): Promise<ProgressArtifactRef>;
```

Defined in: packages/agent/src/types.ts:838

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `content` | `string` |
| `options?` | [`ProgressWriteOptions`](/api/@graphorin/agent/progress/interfaces/ProgressWriteOptions.md) |

#### Returns

`Promise`\&lt;[`ProgressArtifactRef`](/api/@graphorin/core/interfaces/ProgressArtifactRef.md)\&gt;
