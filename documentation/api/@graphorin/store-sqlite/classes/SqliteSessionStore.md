[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / SqliteSessionStore

# Class: SqliteSessionStore

Defined in: [packages/store-sqlite/src/session-store.ts:29](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/session-store.ts#L29)

Default `SessionStore` implementation. Owns:
  - `sessions` rows.
  - `agents_registry` rows.
  - `session_handoffs` rows.
  - `session_workflow_runs` mapping.
  - `session_audit` lifecycle rows.

Per `DEC-147`, the actual `session_messages` rows live in
`@graphorin/store-sqlite`'s `MemoryStore` (single source of truth).

## Stable

## Implements

- [`SessionStoreExt`](/api/@graphorin/core/interfaces/SessionStoreExt.md)

## Constructors

### Constructor

```ts
new SqliteSessionStore(conn): SqliteSessionStore;
```

Defined in: [packages/store-sqlite/src/session-store.ts:31](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/session-store.ts#L31)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `conn` | [`SqliteConnection`](/api/@graphorin/store-sqlite/connection/interfaces/SqliteConnection.md) |

#### Returns

`SqliteSessionStore`

## Methods

### appendAuditEntry()

```ts
appendAuditEntry(entry): Promise<void>;
```

Defined in: [packages/store-sqlite/src/session-store.ts:203](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/session-store.ts#L203)

Append a session-lifecycle audit row.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `entry` | [`SessionAuditEntry`](/api/@graphorin/core/interfaces/SessionAuditEntry.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Implementation of

[`SessionStoreExt`](/api/@graphorin/core/interfaces/SessionStoreExt.md).[`appendAuditEntry`](/api/@graphorin/core/interfaces/SessionStoreExt.md#appendauditentry)

***

### appendHandoff()

```ts
appendHandoff(sessionId, record): Promise<void>;
```

Defined in: [packages/store-sqlite/src/session-store.ts:135](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/session-store.ts#L135)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sessionId` | `string` |
| `record` | [`HandoffRecord`](/api/@graphorin/core/interfaces/HandoffRecord.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Implementation of

[`SessionStoreExt`](/api/@graphorin/core/interfaces/SessionStoreExt.md).[`appendHandoff`](/api/@graphorin/core/interfaces/SessionStoreExt.md#appendhandoff)

***

### attachWorkflowRun()

```ts
attachWorkflowRun(run): Promise<void>;
```

Defined in: [packages/store-sqlite/src/session-store.ts:168](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/session-store.ts#L168)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `run` | [`SessionWorkflowRun`](/api/@graphorin/core/interfaces/SessionWorkflowRun.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Implementation of

[`SessionStoreExt`](/api/@graphorin/core/interfaces/SessionStoreExt.md).[`attachWorkflowRun`](/api/@graphorin/core/interfaces/SessionStoreExt.md#attachworkflowrun)

***

### closeSession()

```ts
closeSession(sessionId, closedAt): Promise<void>;
```

Defined in: [packages/store-sqlite/src/session-store.ts:90](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/session-store.ts#L90)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sessionId` | `string` |
| `closedAt` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Implementation of

[`SessionStoreExt`](/api/@graphorin/core/interfaces/SessionStoreExt.md).[`closeSession`](/api/@graphorin/core/interfaces/SessionStoreExt.md#closesession)

***

### createSession()

```ts
createSession(metadata): Promise<void>;
```

Defined in: [packages/store-sqlite/src/session-store.ts:35](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/session-store.ts#L35)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `metadata` | [`SessionMetadata`](/api/@graphorin/core/interfaces/SessionMetadata.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Implementation of

[`SessionStoreExt`](/api/@graphorin/core/interfaces/SessionStoreExt.md).[`createSession`](/api/@graphorin/core/interfaces/SessionStoreExt.md#createsession)

***

### deleteAgent()

```ts
deleteAgent(agentId): Promise<void>;
```

Defined in: [packages/store-sqlite/src/session-store.ts:117](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/session-store.ts#L117)

Hard-delete an agent. Used by `AgentRegistry.delete(...)`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `agentId` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Implementation of

[`SessionStoreExt`](/api/@graphorin/core/interfaces/SessionStoreExt.md).[`deleteAgent`](/api/@graphorin/core/interfaces/SessionStoreExt.md#deleteagent)

***

### deleteSession()

```ts
deleteSession(sessionId): Promise<void>;
```

Defined in: [packages/store-sqlite/src/session-store.ts:238](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/session-store.ts#L238)

RP-6: hard-delete a session + its handoffs / workflow runs / audit rows.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sessionId` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Implementation of

[`SessionStoreExt`](/api/@graphorin/core/interfaces/SessionStoreExt.md).[`deleteSession`](/api/@graphorin/core/interfaces/SessionStoreExt.md#deletesession)

***

### getSession()

```ts
getSession(sessionId): Promise<
  | SessionMetadata
| null>;
```

Defined in: [packages/store-sqlite/src/session-store.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/session-store.ts#L52)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sessionId` | `string` |

#### Returns

`Promise`\<
  \| [`SessionMetadata`](/api/@graphorin/core/interfaces/SessionMetadata.md)
  \| `null`\>

#### Implementation of

[`SessionStoreExt`](/api/@graphorin/core/interfaces/SessionStoreExt.md).[`getSession`](/api/@graphorin/core/interfaces/SessionStoreExt.md#getsession)

***

### listAgents()

```ts
listAgents(): Promise<readonly AgentRegistryEntry[]>;
```

Defined in: [packages/store-sqlite/src/session-store.ts:128](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/session-store.ts#L128)

List all known agents (including retired ones).

#### Returns

`Promise`\&lt;readonly [`AgentRegistryEntry`](/api/@graphorin/core/interfaces/AgentRegistryEntry.md)[]\&gt;

#### Implementation of

[`SessionStoreExt`](/api/@graphorin/core/interfaces/SessionStoreExt.md).[`listAgents`](/api/@graphorin/core/interfaces/SessionStoreExt.md#listagents)

***

### listAuditEntries()

```ts
listAuditEntries(sessionId, opts?): Promise<readonly SessionAuditEntry[]>;
```

Defined in: [packages/store-sqlite/src/session-store.ts:220](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/session-store.ts#L220)

List recent audit rows for a session, newest-first.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sessionId` | `string` |
| `opts` | \{ `limit?`: `number`; \} |
| `opts.limit?` | `number` |

#### Returns

`Promise`\&lt;readonly [`SessionAuditEntry`](/api/@graphorin/core/interfaces/SessionAuditEntry.md)[]\&gt;

#### Implementation of

[`SessionStoreExt`](/api/@graphorin/core/interfaces/SessionStoreExt.md).[`listAuditEntries`](/api/@graphorin/core/interfaces/SessionStoreExt.md#listauditentries)

***

### listHandoffs()

```ts
listHandoffs(sessionId): Promise<readonly HandoffRecord[]>;
```

Defined in: [packages/store-sqlite/src/session-store.ts:160](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/session-store.ts#L160)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sessionId` | `string` |

#### Returns

`Promise`\&lt;readonly [`HandoffRecord`](/api/@graphorin/core/interfaces/HandoffRecord.md)[]\&gt;

#### Implementation of

[`SessionStoreExt`](/api/@graphorin/core/interfaces/SessionStoreExt.md).[`listHandoffs`](/api/@graphorin/core/interfaces/SessionStoreExt.md#listhandoffs)

***

### listSessions()

```ts
listSessions(scope): Promise<readonly SessionMetadata[]>;
```

Defined in: [packages/store-sqlite/src/session-store.ts:57](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/session-store.ts#L57)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | `Pick`\&lt;[`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md), `"userId"` \| `"agentId"`\&gt; |

#### Returns

`Promise`\&lt;readonly [`SessionMetadata`](/api/@graphorin/core/interfaces/SessionMetadata.md)[]\&gt;

#### Implementation of

[`SessionStoreExt`](/api/@graphorin/core/interfaces/SessionStoreExt.md).[`listSessions`](/api/@graphorin/core/interfaces/SessionStoreExt.md#listsessions)

***

### listWorkflowRuns()

```ts
listWorkflowRuns(sessionId): Promise<readonly SessionWorkflowRun[]>;
```

Defined in: [packages/store-sqlite/src/session-store.ts:187](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/session-store.ts#L187)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sessionId` | `string` |

#### Returns

`Promise`\&lt;readonly [`SessionWorkflowRun`](/api/@graphorin/core/interfaces/SessionWorkflowRun.md)[]\&gt;

#### Implementation of

[`SessionStoreExt`](/api/@graphorin/core/interfaces/SessionStoreExt.md).[`listWorkflowRuns`](/api/@graphorin/core/interfaces/SessionStoreExt.md#listworkflowruns)

***

### pruneAuditEntries()

```ts
pruneAuditEntries(beforeEpochMs): Promise<number>;
```

Defined in: [packages/store-sqlite/src/session-store.ts:232](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/session-store.ts#L232)

Delete audit rows older than the supplied epoch ms.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `beforeEpochMs` | `number` |

#### Returns

`Promise`\&lt;`number`\&gt;

#### Implementation of

[`SessionStoreExt`](/api/@graphorin/core/interfaces/SessionStoreExt.md).[`pruneAuditEntries`](/api/@graphorin/core/interfaces/SessionStoreExt.md#pruneauditentries)

***

### pruneSessions()

```ts
pruneSessions(opts): Promise<number>;
```

Defined in: [packages/store-sqlite/src/session-store.ts:245](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/session-store.ts#L245)

RP-6: retention sweep - delete every session matching the policy.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | \{ `beforeEpochMs?`: `number`; `closedOnly?`: `boolean`; \} |
| `opts.beforeEpochMs?` | `number` |
| `opts.closedOnly?` | `boolean` |

#### Returns

`Promise`\&lt;`number`\&gt;

#### Implementation of

[`SessionStoreExt`](/api/@graphorin/core/interfaces/SessionStoreExt.md).[`pruneSessions`](/api/@graphorin/core/interfaces/SessionStoreExt.md#prunesessions)

***

### registerAgent()

```ts
registerAgent(entry): Promise<void>;
```

Defined in: [packages/store-sqlite/src/session-store.ts:97](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/session-store.ts#L97)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `entry` | [`AgentRegistryEntry`](/api/@graphorin/core/interfaces/AgentRegistryEntry.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Implementation of

[`SessionStoreExt`](/api/@graphorin/core/interfaces/SessionStoreExt.md).[`registerAgent`](/api/@graphorin/core/interfaces/SessionStoreExt.md#registeragent)

***

### resolveAgent()

```ts
resolveAgent(agentId): Promise<
  | AgentRegistryEntry
| null>;
```

Defined in: [packages/store-sqlite/src/session-store.ts:121](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/session-store.ts#L121)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `agentId` | `string` |

#### Returns

`Promise`\<
  \| [`AgentRegistryEntry`](/api/@graphorin/core/interfaces/AgentRegistryEntry.md)
  \| `null`\>

#### Implementation of

[`SessionStoreExt`](/api/@graphorin/core/interfaces/SessionStoreExt.md).[`resolveAgent`](/api/@graphorin/core/interfaces/SessionStoreExt.md#resolveagent)

***

### retireAgent()

```ts
retireAgent(agentId, retiredAt): Promise<void>;
```

Defined in: [packages/store-sqlite/src/session-store.ts:110](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/session-store.ts#L110)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `agentId` | `string` |
| `retiredAt` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Implementation of

[`SessionStoreExt`](/api/@graphorin/core/interfaces/SessionStoreExt.md).[`retireAgent`](/api/@graphorin/core/interfaces/SessionStoreExt.md#retireagent)

***

### updateSession()

```ts
updateSession(sessionId, patch): Promise<void>;
```

Defined in: [packages/store-sqlite/src/session-store.ts:73](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/session-store.ts#L73)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sessionId` | `string` |
| `patch` | `Partial`\&lt;[`SessionMetadata`](/api/@graphorin/core/interfaces/SessionMetadata.md)\&gt; |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Implementation of

[`SessionStoreExt`](/api/@graphorin/core/interfaces/SessionStoreExt.md).[`updateSession`](/api/@graphorin/core/interfaces/SessionStoreExt.md#updatesession)

***

### updateWorkflowRunStatus()

```ts
updateWorkflowRunStatus(
   sessionId, 
   workflowId, 
   threadId, 
status): Promise<void>;
```

Defined in: [packages/store-sqlite/src/session-store.ts:175](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/session-store.ts#L175)

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

#### Implementation of

[`SessionStoreExt`](/api/@graphorin/core/interfaces/SessionStoreExt.md).[`updateWorkflowRunStatus`](/api/@graphorin/core/interfaces/SessionStoreExt.md#updateworkflowrunstatus)
