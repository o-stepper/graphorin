[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ProfileProjectionConfig

# Interface: ProfileProjectionConfig

Defined in: packages/memory/src/consolidator/phases/profile-projection.ts:56

**`Stable`**

`createMemory({ profile })` configuration (public shape).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-maxchars"></a> `maxChars?` | `readonly` | `number` | Character bound enforced on the stored block. Default `1600`. | packages/memory/src/consolidator/phases/profile-projection.ts:67 |
| <a id="property-maxslots"></a> `maxSlots?` | `readonly` | `number` | Maximum number of slots kept. Default `24`. | packages/memory/src/consolidator/phases/profile-projection.ts:65 |
| <a id="property-scope"></a> `scope?` | `readonly` | `"session"` \| `"user"` | Block scope: `'user'` (default) writes one user-scoped block (survives session deletion; erased via `working.purge`); `'session'` keeps the firing scope for per-peer profiles. | packages/memory/src/consolidator/phases/profile-projection.ts:73 |
| <a id="property-topics"></a> `topics?` | `readonly` | readonly `string`[] | Topic taxonomy the projection is restricted to (supplied by the operator - e.g. `['identity', 'preferences', 'health', 'work']`). When given, slots whose topic is not in the list are dropped deterministically; when omitted the model chooses topics freely. | packages/memory/src/consolidator/phases/profile-projection.ts:63 |
