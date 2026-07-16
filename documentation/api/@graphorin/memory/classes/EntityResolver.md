[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / EntityResolver

# Class: EntityResolver

Defined in: [packages/memory/src/graph/entity-resolver.ts:227](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/graph/entity-resolver.ts#L227)

Resolves a fact's subject / object strings to canonical entity ids and
links them, applying [resolveEntityDecision](/api/@graphorin/memory/functions/resolveEntityDecision.md) backed by an
injected store + embedder (+ optional provider for adjudication).
Constructed only when entity resolution is opted in
(`createMemory({ graph: { entityResolution: true } })`); otherwise the
write path skips it and behaviour is unchanged + offline.

## Stable

## Constructors

### Constructor

```ts
new EntityResolver(deps): EntityResolver;
```

Defined in: [packages/memory/src/graph/entity-resolver.ts:236](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/graph/entity-resolver.ts#L236)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `deps` | [`EntityResolverDeps`](/api/@graphorin/memory/interfaces/EntityResolverDeps.md) |

#### Returns

`EntityResolver`

## Methods

### linkFact()

```ts
linkFact(
   scope, 
   fact, 
opts?): Promise<void>;
```

Defined in: [packages/memory/src/graph/entity-resolver.ts:295](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/graph/entity-resolver.ts#L295)

Resolve + link a fact's subject and object (the predicate is a
relation label, never an entity). Idempotent on re-link.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `fact` | [`Fact`](/api/@graphorin/core/interfaces/Fact.md) |
| `opts` | \{ `signal?`: `AbortSignal`; \} |
| `opts.signal?` | `AbortSignal` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### resolve()

```ts
resolve(
   scope, 
   rawName, 
opts?): Promise<string | null>;
```

Defined in: [packages/memory/src/graph/entity-resolver.ts:251](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/graph/entity-resolver.ts#L251)

Resolve a single name to a canonical entity id (find-or-create),
deduping via lexical + embedding similarity. Returns `null` for a
name that normalizes to empty (no entity).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `rawName` | `string` |
| `opts` | \{ `signal?`: `AbortSignal`; \} |
| `opts.signal?` | `AbortSignal` |

#### Returns

`Promise`\&lt;`string` \| `null`\&gt;
