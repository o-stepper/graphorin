[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / SessionStoreExt

# Interface: SessionStoreExt

Defined in: packages/core/src/contracts/session-store.ts:115

Optional extension surface for storage adapters that expose the
additional capabilities `@graphorin/sessions` consumes.
Adapters that opt out leave the property undefined; the sessions
facade degrades gracefully (delete becomes retire; audit rows are
dropped on the floor with a one-time WARN).

Implementations: `SqliteSessionStore` (`@graphorin/store-sqlite`).

## Stable

## Extends

- [`SessionStore`](/api/@graphorin/core/interfaces/SessionStore.md)

## Methods

### appendAuditEntry()

```ts
appendAuditEntry(entry): Promise<void>;
```

Defined in: packages/core/src/contracts/session-store.ts:128

Append a session-lifecycle audit row.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `entry` | [`SessionAuditEntry`](/api/@graphorin/core/interfaces/SessionAuditEntry.md) |

#### Returns

`Promise`\<`void`\>

***

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

#### Inherited from

[`SessionStore`](/api/@graphorin/core/interfaces/SessionStore.md).[`appendHandoff`](/api/@graphorin/core/interfaces/SessionStore.md#appendhandoff)

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

#### Inherited from

[`SessionStore`](/api/@graphorin/core/interfaces/SessionStore.md).[`attachWorkflowRun`](/api/@graphorin/core/interfaces/SessionStore.md#attachworkflowrun)

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

#### Inherited from

[`SessionStore`](/api/@graphorin/core/interfaces/SessionStore.md).[`closeSession`](/api/@graphorin/core/interfaces/SessionStore.md#closesession)

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

#### Inherited from

[`SessionStore`](/api/@graphorin/core/interfaces/SessionStore.md).[`createSession`](/api/@graphorin/core/interfaces/SessionStore.md#createsession)

***

### deleteAgent()

```ts
deleteAgent(agentId): Promise<void>;
```

Defined in: packages/core/src/contracts/session-store.ts:117

Hard-delete an agent. Used by `AgentRegistry.delete(...)`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `agentId` | `string` |

#### Returns

`Promise`\<`void`\>

***

### deleteSession()

```ts
deleteSession(sessionId): Promise<void>;
```

Defined in: packages/core/src/contracts/session-store.ts:152

Hard-delete a session and cascade its session-owned rows - handoffs,
workflow-run attachments, and audit entries (RP-6) - **plus the
session's content**: its `session_messages` rows (with their FTS and
vector index entries) and any episodes scoped to the session
(store-01). The cascade also erases the checkpoints of suspended
runs (W-005): `workflow_checkpoints` / `workflow_pending_writes`
rows for every thread linked to the session, whether through the
workflow-run attachment mapping or through the `sessionId`
checkpoint metadata the agent runtime stamps on HITL suspends -
those snapshots embed the full conversation. After this call the
conversation is no longer retrievable through `memory.session.*`
search surfaces nor resumable from its checkpoints. A no-op for an
unknown id. Custom implementations must honour the same contract in
full - leaving any of these surfaces behind defeats erasure.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sessionId` | `string` |

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

#### Inherited from

[`SessionStore`](/api/@graphorin/core/interfaces/SessionStore.md).[`getSession`](/api/@graphorin/core/interfaces/SessionStore.md#getsession)

***

### listAgents()

```ts
listAgents(): Promise<readonly AgentRegistryEntry[]>;
```

Defined in: packages/core/src/contracts/session-store.ts:119

List all known agents (including retired ones).

#### Returns

`Promise`\<readonly [`AgentRegistryEntry`](/api/@graphorin/core/interfaces/AgentRegistryEntry.md)[]\>

***

### listAuditEntries()

```ts
listAuditEntries(sessionId, opts?): Promise<readonly SessionAuditEntry[]>;
```

Defined in: packages/core/src/contracts/session-store.ts:130

List recent audit rows for a session, newest-first.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sessionId` | `string` |
| `opts?` | \{ `limit?`: `number`; \} |
| `opts.limit?` | `number` |

#### Returns

`Promise`\<readonly [`SessionAuditEntry`](/api/@graphorin/core/interfaces/SessionAuditEntry.md)[]\>

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

#### Inherited from

[`SessionStore`](/api/@graphorin/core/interfaces/SessionStore.md).[`listHandoffs`](/api/@graphorin/core/interfaces/SessionStore.md#listhandoffs)

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

#### Inherited from

[`SessionStore`](/api/@graphorin/core/interfaces/SessionStore.md).[`listSessions`](/api/@graphorin/core/interfaces/SessionStore.md#listsessions)

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

#### Inherited from

[`SessionStore`](/api/@graphorin/core/interfaces/SessionStore.md).[`listWorkflowRuns`](/api/@graphorin/core/interfaces/SessionStore.md#listworkflowruns)

***

### pruneAuditEntries()

```ts
pruneAuditEntries(beforeEpochMs): Promise<number>;
```

Defined in: packages/core/src/contracts/session-store.ts:135

Delete audit rows older than the supplied epoch ms.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `beforeEpochMs` | `number` |

#### Returns

`Promise`\<`number`\>

***

### pruneSessions()

```ts
pruneSessions(opts): Promise<number>;
```

Defined in: packages/core/src/contracts/session-store.ts:159

Retention sweep (RP-6): hard-delete (cascade) every session matching the
policy. `beforeEpochMs` limits to sessions created before that instant;
`closedOnly` limits to closed sessions. With neither, deletes all sessions.
Returns the number of sessions deleted.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | \{ `beforeEpochMs?`: `number`; `closedOnly?`: `boolean`; \} |
| `opts.beforeEpochMs?` | `number` |
| `opts.closedOnly?` | `boolean` |

#### Returns

`Promise`\<`number`\>

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

#### Inherited from

[`SessionStore`](/api/@graphorin/core/interfaces/SessionStore.md).[`registerAgent`](/api/@graphorin/core/interfaces/SessionStore.md#registeragent)

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

#### Inherited from

[`SessionStore`](/api/@graphorin/core/interfaces/SessionStore.md).[`resolveAgent`](/api/@graphorin/core/interfaces/SessionStore.md#resolveagent)

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

#### Inherited from

[`SessionStore`](/api/@graphorin/core/interfaces/SessionStore.md).[`retireAgent`](/api/@graphorin/core/interfaces/SessionStore.md#retireagent)

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

#### Inherited from

[`SessionStore`](/api/@graphorin/core/interfaces/SessionStore.md).[`updateSession`](/api/@graphorin/core/interfaces/SessionStore.md#updatesession)

***

### updateWorkflowRunStatus()

```ts
updateWorkflowRunStatus(
   sessionId, 
   workflowId, 
   threadId, 
status): Promise<void>;
```

Defined in: packages/core/src/contracts/session-store.ts:121

Update the status of a workflow attachment.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sessionId` | `string` |
| `workflowId` | `string` |
| `threadId` | `string` |
| `status` | `"running"` \| `"suspended"` \| `"completed"` \| `"failed"` |

#### Returns

`Promise`\<`void`\>
