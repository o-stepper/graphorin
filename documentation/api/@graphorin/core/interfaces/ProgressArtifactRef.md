[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ProgressArtifactRef

# Interface: ProgressArtifactRef

Defined in: [packages/core/src/types/agent-event.ts:478](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L478)

Reference to a persisted progress artifact returned by
`agent.progress.write(...)` and `agent.progress.read(...)`.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-path"></a> `path` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:479](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L479) |
| <a id="property-role"></a> `role` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:480](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L480) |
| <a id="property-sensitivity"></a> `sensitivity` | `readonly` | `"public"` \| `"internal"` \| `"secret"` | [packages/core/src/types/agent-event.ts:483](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L483) |
| <a id="property-seq"></a> `seq` | `readonly` | `number` | [packages/core/src/types/agent-event.ts:481](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L481) |
| <a id="property-sha256"></a> `sha256` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:486](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L486) |
| <a id="property-sizebytes"></a> `sizeBytes` | `readonly` | `number` | [packages/core/src/types/agent-event.ts:482](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L482) |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | [packages/core/src/types/agent-event.ts:484](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L484) |
| <a id="property-writtenatiso"></a> `writtenAtIso` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:485](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L485) |
