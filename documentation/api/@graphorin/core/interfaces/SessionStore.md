[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / SessionStore

# Interface: SessionStore

Defined in: packages/core/src/contracts/session-store.ts:84

Pluggable session-metadata storage. Implementations live in the
storage adapter packages.

## Stable

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

`Promise`\<`void`\>

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

`Promise`\<`void`\>

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

`Promise`\<`void`\>

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

`Promise`\<`void`\>

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

`Promise`\<readonly [`HandoffRecord`](/api/@graphorin/core/interfaces/HandoffRecord.md)[]\>

***

### listSessions()

```ts
listSessions(scope): Promise<readonly SessionMetadata[]>;
```

Defined in: packages/core/src/contracts/session-store.ts:87

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | `Pick`\<[`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md), `"userId"` \| `"agentId"`\> |

#### Returns

`Promise`\<readonly [`SessionMetadata`](/api/@graphorin/core/interfaces/SessionMetadata.md)[]\>

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

`Promise`\<readonly [`SessionWorkflowRun`](/api/@graphorin/core/interfaces/SessionWorkflowRun.md)[]\>

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

`Promise`\<`void`\>

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

`Promise`\<`void`\>

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
| `patch` | `Partial`\<[`SessionMetadata`](/api/@graphorin/core/interfaces/SessionMetadata.md)\> |

#### Returns

`Promise`\<`void`\>
