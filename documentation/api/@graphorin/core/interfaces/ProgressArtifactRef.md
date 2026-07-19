[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ProgressArtifactRef

# Interface: ProgressArtifactRef

Defined in: packages/core/src/types/agent-event.ts:478

**`Stable`**

Reference to a persisted progress artifact returned by
`agent.progress.write(...)` and `agent.progress.read(...)`.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-path"></a> `path` | `readonly` | `string` | packages/core/src/types/agent-event.ts:479 |
| <a id="property-role"></a> `role` | `readonly` | `string` | packages/core/src/types/agent-event.ts:480 |
| <a id="property-sensitivity"></a> `sensitivity` | `readonly` | `"public"` \| `"internal"` \| `"secret"` | packages/core/src/types/agent-event.ts:483 |
| <a id="property-seq"></a> `seq` | `readonly` | `number` | packages/core/src/types/agent-event.ts:481 |
| <a id="property-sha256"></a> `sha256` | `readonly` | `string` | packages/core/src/types/agent-event.ts:486 |
| <a id="property-sizebytes"></a> `sizeBytes` | `readonly` | `number` | packages/core/src/types/agent-event.ts:482 |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | packages/core/src/types/agent-event.ts:484 |
| <a id="property-writtenatiso"></a> `writtenAtIso` | `readonly` | `string` | packages/core/src/types/agent-event.ts:485 |
