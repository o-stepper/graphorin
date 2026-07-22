[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / IsolatedVMContext

# Interface: IsolatedVMContext

Defined in: packages/security/src/sandbox/isolated-vm.ts:59

**`Stable`**

Structural view of an `isolated-vm` execution context.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-global"></a> `global` | `readonly` | \{ `setSync`: (`name`, `value`) => `void`; \} | packages/security/src/sandbox/isolated-vm.ts:60 |
| `global.setSync` | `readonly` | (`name`, `value`) => `void` | packages/security/src/sandbox/isolated-vm.ts:60 |
| <a id="property-release"></a> `release` | `readonly` | () => `void` | packages/security/src/sandbox/isolated-vm.ts:61 |
