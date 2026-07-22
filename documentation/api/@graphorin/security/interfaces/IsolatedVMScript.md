[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / IsolatedVMScript

# Interface: IsolatedVMScript

Defined in: packages/security/src/sandbox/isolated-vm.ts:69

**`Stable`**

Structural view of an `isolated-vm` compiled script.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-release"></a> `release` | `readonly` | () => `void` | packages/security/src/sandbox/isolated-vm.ts:74 |
| <a id="property-run"></a> `run` | `readonly` | (`context`, `opts?`) => `Promise`\&lt;`unknown`\&gt; | packages/security/src/sandbox/isolated-vm.ts:70 |
