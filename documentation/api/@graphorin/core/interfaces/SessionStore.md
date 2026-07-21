[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / SessionStore

# Interface: SessionStore

Defined in: packages/core/src/contracts/session-store.ts:84

**`Stable`**

Pluggable session-metadata storage. Implementations live in the
storage adapter packages.

## Extended by

- [`SessionStoreExt`](/api/@graphorin/core/interfaces/SessionStoreExt.md)

## Methods

### appendHandoff()

```ts
appendHandoff(sessionId, record): Promise<void>;
```

Defined in: packages/core/src/contracts/session-store.ts:97

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sessionId` | `string` |
| `record` | [`HandoffRecord`](/api/@graphorin/core/interfaces/HandoffRecord.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### attachWorkflowRun()

```ts
attachWorkflowRun(run): Promise<void>;
```

Defined in: packages/core/src/contracts/session-store.ts:100

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `run` | [`SessionWorkflowRun`](/api/@graphorin/core/interfaces/SessionWorkflowRun.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### closeSession()

```ts
closeSession(sessionId, closedAt): Promise<void>;
```

Defined in: packages/core/src/contracts/session-store.ts:91

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sessionId` | `string` |
| `closedAt` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### createSession()

```ts
createSession(metadata): Promise<void>;
```

Defined in: packages/core/src/contracts/session-store.ts:85

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `metadata` | [`SessionMetadata`](/api/@graphorin/core/interfaces/SessionMetadata.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### getSession()

```ts
getSession(sessionId): Promise<
  | SessionMetadata
| null>;
```

Defined in: packages/core/src/contracts/session-store.ts:86

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sessionId` | `string` |

#### Returns

`Promise`\<
  \| [`SessionMetadata`](/api/@graphorin/core/interfaces/SessionMetadata.md)
  \| `null`\>

***

### listHandoffs()

```ts
listHandoffs(sessionId): Promise<readonly HandoffRecord[]>;
```

Defined in: packages/core/src/contracts/session-store.ts:98

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sessionId` | `string` |

#### Returns

`Promise`\&lt;readonly [`HandoffRecord`](/api/@graphorin/core/interfaces/HandoffRecord.md)[]\&gt;

***

### listSessions()

```ts
listSessions(scope): Promise<readonly SessionMetadata[]>;
```

Defined in: packages/core/src/contracts/session-store.ts:87

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | `Pick`\&lt;[`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md), `"userId"` \| `"agentId"`\&gt; |

#### Returns

`Promise`\&lt;readonly [`SessionMetadata`](/api/@graphorin/core/interfaces/SessionMetadata.md)[]\&gt;

***

### listWorkflowRuns()

```ts
listWorkflowRuns(sessionId): Promise<readonly SessionWorkflowRun[]>;
```

Defined in: packages/core/src/contracts/session-store.ts:101

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sessionId` | `string` |

#### Returns

`Promise`\&lt;readonly [`SessionWorkflowRun`](/api/@graphorin/core/interfaces/SessionWorkflowRun.md)[]\&gt;

***

### registerAgent()

```ts
registerAgent(entry): Promise<void>;
```

Defined in: packages/core/src/contracts/session-store.ts:93

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `entry` | [`AgentRegistryEntry`](/api/@graphorin/core/interfaces/AgentRegistryEntry.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### resolveAgent()

```ts
resolveAgent(agentId): Promise<
  | AgentRegistryEntry
| null>;
```

Defined in: packages/core/src/contracts/session-store.ts:95

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `agentId` | `string` |

#### Returns

`Promise`\<
  \| [`AgentRegistryEntry`](/api/@graphorin/core/interfaces/AgentRegistryEntry.md)
  \| `null`\>

***

### retireAgent()

```ts
retireAgent(agentId, retiredAt): Promise<void>;
```

Defined in: packages/core/src/contracts/session-store.ts:94

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `agentId` | `string` |
| `retiredAt` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### updateSession()

```ts
updateSession(sessionId, patch): Promise<void>;
```

Defined in: packages/core/src/contracts/session-store.ts:90

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sessionId` | `string` |
| `patch` | `Partial`\&lt;[`SessionMetadata`](/api/@graphorin/core/interfaces/SessionMetadata.md)\&gt; |

#### Returns

`Promise`\&lt;`void`\&gt;
