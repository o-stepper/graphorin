[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / BridgedSourceOptions

# Interface: BridgedSourceOptions

Defined in: [packages/security/src/sandbox/bridged-source.ts:55](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/bridged-source.ts#L55)

Options for [runBridgedSource](/api/@graphorin/security/functions/runBridgedSource.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-abortgracems"></a> `abortGraceMs?` | `readonly` | `number` | Grace (ms) after abort before forcible `terminate()`. Default 100. | [packages/security/src/sandbox/bridged-source.ts:84](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/bridged-source.ts#L84) |
| <a id="property-allowedtools"></a> `allowedTools` | `readonly` | readonly `string`[] | Names the script may call as `tools.<name>(args)`. | [packages/security/src/sandbox/bridged-source.ts:63](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/bridged-source.ts#L63) |
| <a id="property-dispatch"></a> `dispatch` | `readonly` | (`call`) => `Promise`\&lt;`unknown`\&gt; | Host bridge invoked for each `tools.<name>(args)` call. Resolve with the tool's output (structured-clone safe) or reject to surface an error to the script. Calls for a name not in `allowedTools` are rejected by the runner before `dispatch` is consulted. | [packages/security/src/sandbox/bridged-source.ts:70](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/bridged-source.ts#L70) |
| <a id="property-maxmemorymb"></a> `maxMemoryMb?` | `readonly` | `number` | Memory ceiling (MB) for the worker. Omitted ⇒ Node default. | [packages/security/src/sandbox/bridged-source.ts:74](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/bridged-source.ts#L74) |
| <a id="property-maxtoolcalls"></a> `maxToolCalls?` | `readonly` | `number` | Ceiling on bridged tool calls per run. Default 64. | [packages/security/src/sandbox/bridged-source.ts:82](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/bridged-source.ts#L82) |
| <a id="property-nofilesystem"></a> `noFilesystem?` | `readonly` | `boolean` | Block filesystem (`node:fs`/…) imports. Default true. | [packages/security/src/sandbox/bridged-source.ts:78](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/bridged-source.ts#L78) |
| <a id="property-nonetwork"></a> `noNetwork?` | `readonly` | `boolean` | Block outbound network (`fetch` + `node:http`/`net`/…). Default true. | [packages/security/src/sandbox/bridged-source.ts:76](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/bridged-source.ts#L76) |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | Cancellation signal; aborts the run and terminates the worker. | [packages/security/src/sandbox/bridged-source.ts:80](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/bridged-source.ts#L80) |
| <a id="property-source"></a> `source` | `readonly` | `string` | Model-written JavaScript, evaluated as the body of an `async (tools) => { … }` function. A top-level `return` yields the final result; the value must be structured-clone safe. | [packages/security/src/sandbox/bridged-source.ts:61](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/bridged-source.ts#L61) |
| <a id="property-timeoutms"></a> `timeoutMs?` | `readonly` | `number` | Hard wall-clock timeout (ms) for the whole script. Default 30000. | [packages/security/src/sandbox/bridged-source.ts:72](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/bridged-source.ts#L72) |
| <a id="property-warn"></a> `warn?` | `readonly` | (`message`) => `void` | Optional WARN logger. | [packages/security/src/sandbox/bridged-source.ts:86](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/bridged-source.ts#L86) |
