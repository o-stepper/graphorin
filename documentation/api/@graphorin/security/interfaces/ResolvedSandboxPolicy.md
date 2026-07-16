[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / ResolvedSandboxPolicy

# Interface: ResolvedSandboxPolicy

Defined in: [packages/security/src/sandbox/sandbox.ts:76](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/sandbox.ts#L76)

Per-tool / per-skill sandbox policy. The dispatcher resolves the
effective policy from the trust tier, the source, and any operator
overrides; downstream code consumes the resolved object verbatim.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-forced"></a> `forced` | `readonly` | `boolean` | Whether the resolver mandated this policy regardless of operator preference. | [packages/security/src/sandbox/sandbox.ts:87](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/sandbox.ts#L87) |
| <a id="property-kind"></a> `kind` | `readonly` | [`SandboxKind`](/api/@graphorin/security/type-aliases/SandboxKind.md) | - | [packages/security/src/sandbox/sandbox.ts:77](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/sandbox.ts#L77) |
| <a id="property-maxmemorymb"></a> `maxMemoryMb` | `readonly` | `number` | Memory ceiling in MB. | [packages/security/src/sandbox/sandbox.ts:85](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/sandbox.ts#L85) |
| <a id="property-nofilesystem"></a> `noFilesystem` | `readonly` | `boolean` | Block filesystem access. | [packages/security/src/sandbox/sandbox.ts:81](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/sandbox.ts#L81) |
| <a id="property-nonetwork"></a> `noNetwork` | `readonly` | `boolean` | Block outbound network calls. | [packages/security/src/sandbox/sandbox.ts:79](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/sandbox.ts#L79) |
| <a id="property-reason"></a> `reason` | `readonly` | `string` | Human-readable explanation surfaced through traces / WARN logs. | [packages/security/src/sandbox/sandbox.ts:89](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/sandbox.ts#L89) |
| <a id="property-timeoutms"></a> `timeoutMs` | `readonly` | `number` | Hard wall-clock timeout in milliseconds. | [packages/security/src/sandbox/sandbox.ts:83](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/sandbox.ts#L83) |
