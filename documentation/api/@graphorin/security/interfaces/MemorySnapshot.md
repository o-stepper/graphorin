[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / MemorySnapshot

# Interface: MemorySnapshot

Defined in: [packages/security/src/guard/types.ts:38](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guard/types.ts#L38)

Snapshot a guard takes before / after a tool runs. Implementations
record the xxhash digest of the regions of memory the tool could
touch; the guard compares the after-snapshot against the
before-snapshot to detect non-tool-mediated mutation.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-digest"></a> `digest` | `readonly` | readonly \{ `hash`: `string`; `region`: `string`; \}[] | xxhash digest of every relevant region. Empty for `NO_GUARD`. | [packages/security/src/guard/types.ts:40](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guard/types.ts#L40) |
| <a id="property-durationus"></a> `durationUs` | `readonly` | `number` | Total snapshot wall-clock duration in microseconds. | [packages/security/src/guard/types.ts:42](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guard/types.ts#L42) |
