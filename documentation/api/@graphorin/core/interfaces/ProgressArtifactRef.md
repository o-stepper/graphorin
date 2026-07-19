[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ProgressArtifactRef

# Interface: ProgressArtifactRef

Defined in: packages/core/src/types/agent-event.ts:502

**`Stable`**

Reference to a persisted progress artifact returned by
`agent.progress.write(...)` and `agent.progress.read(...)`.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-path"></a> `path` | `readonly` | `string` | packages/core/src/types/agent-event.ts:503 |
| <a id="property-role"></a> `role` | `readonly` | `string` | packages/core/src/types/agent-event.ts:504 |
| <a id="property-sensitivity"></a> `sensitivity` | `readonly` | `"public"` \| `"internal"` \| `"secret"` | packages/core/src/types/agent-event.ts:507 |
| <a id="property-seq"></a> `seq` | `readonly` | `number` | packages/core/src/types/agent-event.ts:505 |
| <a id="property-sha256"></a> `sha256` | `readonly` | `string` | packages/core/src/types/agent-event.ts:510 |
| <a id="property-sizebytes"></a> `sizeBytes` | `readonly` | `number` | packages/core/src/types/agent-event.ts:506 |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | packages/core/src/types/agent-event.ts:508 |
| <a id="property-writtenatiso"></a> `writtenAtIso` | `readonly` | `string` | packages/core/src/types/agent-event.ts:509 |
