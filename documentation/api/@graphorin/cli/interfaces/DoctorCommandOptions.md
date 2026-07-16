[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / DoctorCommandOptions

# Interface: DoctorCommandOptions

Defined in: [packages/cli/src/commands/doctor.ts:54](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/doctor.ts#L54)

## Stable

## Extends

- `CommonOutputOptions`

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-all"></a> `all?` | `readonly` | `boolean` | Run every check. Equivalent to passing every `--check-*` flag. | - | [packages/cli/src/commands/doctor.ts:81](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/doctor.ts#L81) |
| <a id="property-checkencryption"></a> `checkEncryption?` | `readonly` | `boolean` | Run the audit-encryption check. | - | [packages/cli/src/commands/doctor.ts:75](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/doctor.ts#L75) |
| <a id="property-checkperms"></a> `checkPerms?` | `readonly` | `boolean` | Run the file-perms check. Implied by `--all`. | - | [packages/cli/src/commands/doctor.ts:71](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/doctor.ts#L71) |
| <a id="property-checksecrets"></a> `checkSecrets?` | `readonly` | `boolean` | Run the secrets-store check. | - | [packages/cli/src/commands/doctor.ts:73](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/doctor.ts#L73) |
| <a id="property-checksystemd"></a> `checkSystemd?` | `readonly` | `boolean` | Run the systemd check. Linux-only. | - | [packages/cli/src/commands/doctor.ts:77](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/doctor.ts#L77) |
| <a id="property-config"></a> `config?` | `readonly` | `string` | F-06: check the storage / audit paths resolved from this `graphorin.config.*` file instead of the hardcoded `~/.graphorin` layout, so doctor and `graphorin init` (which writes a PROJECT config) live in the same world. Without the flag the default `~/.graphorin` layout is checked, as before. | - | [packages/cli/src/commands/doctor.ts:67](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/doctor.ts#L67) |
| <a id="property-fixperms"></a> `fixPerms?` | `readonly` | `boolean` | Run the file-perms repair. | - | [packages/cli/src/commands/doctor.ts:69](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/doctor.ts#L69) |
| <a id="property-home"></a> `home?` | `readonly` | `string` | Override the directory the doctor checks. Defaults to `~/.graphorin/`. Tests inject a fresh tmp dir. | - | [packages/cli/src/commands/doctor.ts:59](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/doctor.ts#L59) |
| <a id="property-json"></a> `json?` | `readonly` | `boolean` | Emit a structured JSON document instead of human-readable text. | `CommonOutputOptions.json` | [packages/cli/src/internal/output.ts:71](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L71) |
| <a id="property-jsonprint"></a> `jsonPrint?` | `readonly` | `JsonSink` | Test seam - capture JSON documents instead of writing to stdout. | `CommonOutputOptions.jsonPrint` | [packages/cli/src/internal/output.ts:77](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L77) |
| <a id="property-noninteractive"></a> `nonInteractive?` | `readonly` | `boolean` | Force `--non-interactive` semantics (skip prompts; require flags / env). | `CommonOutputOptions.nonInteractive` | [packages/cli/src/internal/output.ts:73](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L73) |
| <a id="property-print"></a> `print?` | `readonly` | `PrintSink` | Test seam - capture human lines instead of writing to stderr. | `CommonOutputOptions.print` | [packages/cli/src/internal/output.ts:75](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/output.ts#L75) |
| <a id="property-systemdrun"></a> `systemdRun?` | `readonly` | (`cmd`) => `Promise`\&lt;`string`\&gt; | Test seam - supply a custom systemd executor. | - | [packages/cli/src/commands/doctor.ts:83](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/doctor.ts#L83) |
| <a id="property-systemdunit"></a> `systemdUnit?` | `readonly` | `string` | Optional systemd unit identifier (default `graphorin.service`). | - | [packages/cli/src/commands/doctor.ts:79](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/doctor.ts#L79) |
