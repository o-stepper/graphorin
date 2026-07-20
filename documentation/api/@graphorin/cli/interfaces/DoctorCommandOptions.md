[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / DoctorCommandOptions

# Interface: DoctorCommandOptions

Defined in: packages/cli/src/commands/doctor.ts:55

**`Stable`**

## Extends

- [`CommonOutputOptions`](/api/@graphorin/cli/interfaces/CommonOutputOptions.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-all"></a> `all?` | `readonly` | `boolean` | Run every check. Equivalent to passing every `--check-*` flag. | - | packages/cli/src/commands/doctor.ts:82 |
| <a id="property-chattimeoutms"></a> `chatTimeoutMs?` | `readonly` | `number` | Wall-clock bound for the smoke's chat leg. Default 60s. | - | packages/cli/src/commands/doctor.ts:101 |
| <a id="property-checkencryption"></a> `checkEncryption?` | `readonly` | `boolean` | Run the audit-encryption check. | - | packages/cli/src/commands/doctor.ts:76 |
| <a id="property-checkperms"></a> `checkPerms?` | `readonly` | `boolean` | Run the file-perms check. Implied by `--all`. | - | packages/cli/src/commands/doctor.ts:72 |
| <a id="property-checksecrets"></a> `checkSecrets?` | `readonly` | `boolean` | Run the secrets-store check. | - | packages/cli/src/commands/doctor.ts:74 |
| <a id="property-checksystemd"></a> `checkSystemd?` | `readonly` | `boolean` | Run the systemd check. Linux-only. | - | packages/cli/src/commands/doctor.ts:78 |
| <a id="property-config"></a> `config?` | `readonly` | `string` | Check the storage / audit paths resolved from this `graphorin.config.*` file instead of the hardcoded `~/.graphorin` layout, so doctor and `graphorin init` (which writes a PROJECT config) live in the same world. Without the flag the default `~/.graphorin` layout is checked, as before. | - | packages/cli/src/commands/doctor.ts:68 |
| <a id="property-embedmodel"></a> `embedModel?` | `readonly` | `string` | Embedding model for the dimension probe. Default `nomic-embed-text`. | - | packages/cli/src/commands/doctor.ts:99 |
| <a id="property-fixperms"></a> `fixPerms?` | `readonly` | `boolean` | Run the file-perms repair. | - | packages/cli/src/commands/doctor.ts:70 |
| <a id="property-home"></a> `home?` | `readonly` | `string` | Override the directory the doctor checks. Defaults to `~/.graphorin/`. Tests inject a fresh tmp dir. | - | packages/cli/src/commands/doctor.ts:60 |
| <a id="property-json"></a> `json?` | `readonly` | `boolean` | Emit a structured JSON document instead of human-readable text. | [`CommonOutputOptions`](/api/@graphorin/cli/interfaces/CommonOutputOptions.md).[`json`](/api/@graphorin/cli/interfaces/CommonOutputOptions.md#property-json) | packages/cli/src/internal/output.ts:71 |
| <a id="property-jsonprint"></a> `jsonPrint?` | `readonly` | [`JsonSink`](/api/@graphorin/cli/type-aliases/JsonSink.md) | Test seam - capture JSON documents instead of writing to stdout. | [`CommonOutputOptions`](/api/@graphorin/cli/interfaces/CommonOutputOptions.md).[`jsonPrint`](/api/@graphorin/cli/interfaces/CommonOutputOptions.md#property-jsonprint) | packages/cli/src/internal/output.ts:77 |
| <a id="property-noninteractive"></a> `nonInteractive?` | `readonly` | `boolean` | Force `--non-interactive` semantics (skip prompts; require flags / env). | [`CommonOutputOptions`](/api/@graphorin/cli/interfaces/CommonOutputOptions.md).[`nonInteractive`](/api/@graphorin/cli/interfaces/CommonOutputOptions.md#property-noninteractive) | packages/cli/src/internal/output.ts:73 |
| <a id="property-ollamabaseurl"></a> `ollamaBaseUrl?` | `readonly` | `string` | Ollama base URL for the smoke. Default `http://127.0.0.1:11434`. | - | packages/cli/src/commands/doctor.ts:95 |
| <a id="property-ollamamodel"></a> `ollamaModel?` | `readonly` | `string` | Chat model the smoke exercises end to end (streaming + tool call). | - | packages/cli/src/commands/doctor.ts:97 |
| <a id="property-print"></a> `print?` | `readonly` | [`PrintSink`](/api/@graphorin/cli/type-aliases/PrintSink.md) | Test seam - capture human lines instead of writing to stderr. | [`CommonOutputOptions`](/api/@graphorin/cli/interfaces/CommonOutputOptions.md).[`print`](/api/@graphorin/cli/interfaces/CommonOutputOptions.md#property-print) | packages/cli/src/internal/output.ts:75 |
| <a id="property-smokedir"></a> `smokeDir?` | `readonly` | `string` | Test seam - directory for the smoke's throwaway store. | - | packages/cli/src/commands/doctor.ts:105 |
| <a id="property-smokefetchimpl"></a> `smokeFetchImpl?` | `readonly` | (`input`, `init?`) => `Promise`\&lt;`Response`\&gt; | Test seam - injected fetch for the smoke's Ollama calls. | - | packages/cli/src/commands/doctor.ts:103 |
| <a id="property-smokelocal"></a> `smokeLocal?` | `readonly` | `boolean` | Run the local-first smoke: native SQLite stack, write / reopen / search round-trip, Ollama reachability + model inventory, an embedding-dimension probe, and (with [ollamaModel](/api/@graphorin/cli/interfaces/DoctorCommandOptions.md#property-ollamamodel)) a streamed tool-call round-trip through the real adapter. Deliberately NOT implied by `--all` - the Ollama legs talk to a local daemon, which CI hosts may not run. | - | packages/cli/src/commands/doctor.ts:93 |
| <a id="property-systemdrun"></a> `systemdRun?` | `readonly` | (`cmd`) => `Promise`\&lt;`string`\&gt; | Test seam - supply a custom systemd executor. | - | packages/cli/src/commands/doctor.ts:84 |
| <a id="property-systemdunit"></a> `systemdUnit?` | `readonly` | `string` | Optional systemd unit identifier (default `graphorin.service`). | - | packages/cli/src/commands/doctor.ts:80 |
