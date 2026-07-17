[**Graphorin API reference v0.10.2**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [agent-registry](/api/@graphorin/sessions/agent-registry/index.md) / AgentRegistry

# Class: AgentRegistry

Defined in: [packages/sessions/src/agent-registry.ts:64](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/agent-registry.ts#L64)

In-memory + write-through registry of agent metadata.

## Stable

## Constructors

### Constructor

```ts
new AgentRegistry(args): AgentRegistry;
```

Defined in: [packages/sessions/src/agent-registry.ts:69](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/agent-registry.ts#L69)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | \{ `now?`: () => `number`; `store`: [`SessionStoreExt`](/api/@graphorin/core/interfaces/SessionStoreExt.md); \} |
| `args.now?` | () => `number` |
| `args.store` | [`SessionStoreExt`](/api/@graphorin/core/interfaces/SessionStoreExt.md) |

#### Returns

`AgentRegistry`

## Methods

### delete()

```ts
delete(id, opts?): Promise<void>;
```

Defined in: [packages/sessions/src/agent-registry.ts:127](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/agent-registry.ts#L127)

Hard-delete an agent. Subsequent `resolveOrPlaceholder(id)`
returns `{ kind: 'unknown', id }` so replay can substitute a
placeholder.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `opts` | [`RetireAgentOptions`](/api/@graphorin/sessions/agent-registry/interfaces/RetireAgentOptions.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### get()

```ts
get(id): Promise<
  | AgentRegistryEntry
| null>;
```

Defined in: [packages/sessions/src/agent-registry.ts:140](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/agent-registry.ts#L140)

Best-effort lookup. Returns `null` when the agent is unknown.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\<
  \| [`AgentRegistryEntry`](/api/@graphorin/core/interfaces/AgentRegistryEntry.md)
  \| `null`\>

***

### hydrate()

```ts
hydrate(): Promise<void>;
```

Defined in: [packages/sessions/src/agent-registry.ts:79](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/agent-registry.ts#L79)

Hydrate the in-memory cache from the store. Useful when a process
boots after a restart and wants the agent catalogue ready before
any `Session.list({...})` call.

#### Returns

`Promise`\&lt;`void`\&gt;

***

### list()

```ts
list(): Promise<readonly AgentRegistryEntry[]>;
```

Defined in: [packages/sessions/src/agent-registry.ts:151](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/agent-registry.ts#L151)

List every known agent (active + retired).

#### Returns

`Promise`\&lt;readonly [`AgentRegistryEntry`](/api/@graphorin/core/interfaces/AgentRegistryEntry.md)[]\&gt;

***

### register()

```ts
register(id, opts): Promise<AgentRegistryEntry>;
```

Defined in: [packages/sessions/src/agent-registry.ts:89](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/agent-registry.ts#L89)

Idempotent registration. Re-registering the same id refreshes the
display name + tags but preserves the original `registeredAt`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `opts` | [`RegisterAgentOptions`](/api/@graphorin/sessions/agent-registry/interfaces/RegisterAgentOptions.md) |

#### Returns

`Promise`\&lt;[`AgentRegistryEntry`](/api/@graphorin/core/interfaces/AgentRegistryEntry.md)\&gt;

***

### resolveOrPlaceholder()

```ts
resolveOrPlaceholder(id): Promise<AgentRegistryLookup>;
```

Defined in: [packages/sessions/src/agent-registry.ts:160](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/agent-registry.ts#L160)

Replay-safe lookup. Returns `{ kind: 'agent', agent }` when the id
is known (active or retired), or `{ kind: 'unknown', id }` when
the agent has been hard-deleted.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\&lt;[`AgentRegistryLookup`](/api/@graphorin/sessions/agent-registry/type-aliases/AgentRegistryLookup.md)\&gt;

***

### retire()

```ts
retire(id, opts?): Promise<void>;
```

Defined in: [packages/sessions/src/agent-registry.ts:110](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/agent-registry.ts#L110)

Soft-retire an agent. Subsequent `resolveOrPlaceholder(id)` still
returns the metadata (with `retiredAt` set) so replay shows
"(retired) Worker Agent". Pass `{ assertExists: true }` to throw
on an unknown id.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `opts` | [`RetireAgentOptions`](/api/@graphorin/sessions/agent-registry/interfaces/RetireAgentOptions.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### snapshot()

```ts
snapshot(): readonly AgentRegistryEntry[];
```

Defined in: [packages/sessions/src/agent-registry.ts:170](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/agent-registry.ts#L170)

Snapshot of the in-memory cache. Used by JSONL export to embed
`kind: 'agent'` records without an extra round-trip to the store.

#### Returns

readonly [`AgentRegistryEntry`](/api/@graphorin/core/interfaces/AgentRegistryEntry.md)[]
