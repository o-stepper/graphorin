[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / SessionStoreExt

# Interface: SessionStoreExt

Defined in: packages/core/src/contracts/session-store.ts:115

**`Stable`**

Optional extension surface for storage adapters that expose the
additional capabilities `@graphorin/sessions` consumes.
Adapters that opt out leave the property undefined; the sessions
facade degrades gracefully (delete becomes retire; audit rows are
dropped on the floor with a one-time WARN).

Implementations: `SqliteSessionStore` (`@graphorin/store-sqlite`).

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

`Promise`\&lt;`void`\&gt;

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

`Promise`\&lt;`void`\&gt;

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

`Promise`\&lt;`void`\&gt;

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

`Promise`\&lt;`void`\&gt;

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

`Promise`\&lt;`void`\&gt;

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

`Promise`\&lt;`void`\&gt;

***

### deleteSession()

```ts
deleteSession(sessionId): Promise<void>;
```

Defined in: packages/core/src/contracts/session-store.ts:152

Hard-delete a session and cascade its session-owned rows - handoffs,
workflow-run attachments, and audit entries - **plus the
session's content**: its `session_messages` rows (with their FTS and
vector index entries) and any episodes scoped to the
session. The cascade also erases the checkpoints of suspended
runs: `workflow_checkpoints` / `workflow_pending_writes`
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

`Promise`\&lt;readonly [`AgentRegistryEntry`](/api/@graphorin/core/interfaces/AgentRegistryEntry.md)[]\&gt;

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

`Promise`\&lt;readonly [`SessionAuditEntry`](/api/@graphorin/core/interfaces/SessionAuditEntry.md)[]\&gt;

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
| `scope` | `Pick`\&lt;[`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md), `"userId"` \| `"agentId"`\&gt; |

#### Returns

`Promise`\&lt;readonly [`SessionMetadata`](/api/@graphorin/core/interfaces/SessionMetadata.md)[]\&gt;

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

`Promise`\&lt;readonly [`SessionWorkflowRun`](/api/@graphorin/core/interfaces/SessionWorkflowRun.md)[]\&gt;

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

`Promise`\&lt;`number`\&gt;

***

### pruneSessions()

```ts
pruneSessions(opts): Promise<number>;
```

Defined in: packages/core/src/contracts/session-store.ts:159

Retention sweep: hard-delete (cascade) every session matching the
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

`Promise`\&lt;`number`\&gt;

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

`Promise`\&lt;`void`\&gt;

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
| `patch` | `Partial`\&lt;[`SessionMetadata`](/api/@graphorin/core/interfaces/SessionMetadata.md)\&gt; |

#### Returns

`Promise`\&lt;`void`\&gt;

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

`Promise`\&lt;`void`\&gt;
