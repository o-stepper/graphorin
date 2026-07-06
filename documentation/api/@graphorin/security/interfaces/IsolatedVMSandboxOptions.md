[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / IsolatedVMSandboxOptions

# Interface: IsolatedVMSandboxOptions

Defined in: [packages/security/src/sandbox/isolated-vm.ts:68](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/isolated-vm.ts#L68)

Options for `createIsolatedVMSandbox(...)`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-defaulttimeoutms"></a> `defaultTimeoutMs?` | `readonly` | `number` | Default wall-clock timeout (ms). Defaults to 5000. | [packages/security/src/sandbox/isolated-vm.ts:72](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/isolated-vm.ts#L72) |
| <a id="property-fallback"></a> `fallback?` | `readonly` | `"fallback-to-worker-threads"` \| `"throw"` | Adapter to use if the `isolated-vm` peer is unavailable. Defaults to `'fallback-to-worker-threads'`. Set to `'throw'` for production builds that must refuse to start when the peer is missing. | [packages/security/src/sandbox/isolated-vm.ts:78](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/isolated-vm.ts#L78) |
| <a id="property-fallbackadapter"></a> `fallbackAdapter?` | `readonly` | [`SandboxImpl`](/api/@graphorin/security/interfaces/SandboxImpl.md) | Worker-threads adapter to fall back to. Required when `fallback === 'fallback-to-worker-threads'`. | [packages/security/src/sandbox/isolated-vm.ts:80](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/isolated-vm.ts#L80) |
| <a id="property-memorylimitmb"></a> `memoryLimitMb?` | `readonly` | `number` | Memory limit forwarded to `new Isolate({ memoryLimit })`. Defaults to 128 MB per DEC-148. | [packages/security/src/sandbox/isolated-vm.ts:70](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/isolated-vm.ts#L70) |
| <a id="property-peerloader"></a> `peerLoader?` | `readonly` | () => `Promise`\&lt;`IsolatedVMPeerModule`\&gt; | Override the peer-dep loader. Tests pass a stub here so the adapter can run without the native binary. | [packages/security/src/sandbox/isolated-vm.ts:87](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/isolated-vm.ts#L87) |
| <a id="property-warn"></a> `warn?` | `readonly` | (`message`) => `void` | Optional WARN logger called once per process when the fallback engages. | [packages/security/src/sandbox/isolated-vm.ts:82](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/isolated-vm.ts#L82) |
