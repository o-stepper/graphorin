[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / ApplyProcessHardeningOptions

# Interface: ApplyProcessHardeningOptions

Defined in: packages/security/src/hardening/apply.ts:29

**`Stable`**

Options for `applyProcessHardening(...)`.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-allowroot"></a> `allowRoot?` | `readonly` | `boolean` | Allow the framework to run as root even when `refuseRoot` is `true`. Operators must opt in deliberately after reviewing DEC-135. | packages/security/src/hardening/apply.ts:42 |
| <a id="property-preferfchmod"></a> `preferFchmod?` | `readonly` | `boolean` | When the host process started with `--permission`, prefer `fs.fchmod()` over `fs.chmod()` (CVE-2024-36137). The flag is mostly informational here; downstream `ensureFileMode(...)` reads the field via `getHardeningStatus(...)`. | packages/security/src/hardening/apply.ts:49 |
| <a id="property-refuseroot"></a> `refuseRoot?` | `readonly` | `boolean` | Refuse to run as root on POSIX hosts. Defaults to `true`. The framework deliberately makes the safe path the default. | packages/security/src/hardening/apply.ts:34 |
| <a id="property-umask"></a> `umask?` | `readonly` | `number` | Override the default umask (`0o077`). | packages/security/src/hardening/apply.ts:36 |
| <a id="property-warn"></a> `warn?` | `readonly` | (`message`) => `void` | Optional WARN logger. | packages/security/src/hardening/apply.ts:51 |
