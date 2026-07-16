[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / runSecretsRotate

# Function: runSecretsRotate()

```ts
function runSecretsRotate(options): Promise<{
  ok: true;
}>;
```

Defined in: [packages/cli/src/commands/secrets.ts:256](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/secrets.ts#L256)

`graphorin secrets rotate <key>` - overwrite the existing value
with a fresh one. Functionally identical to `set` but the CLI
surfaces the operation explicitly so audit logs can distinguish
a rotation from an initial write.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`SecretsRotateOptions`](/api/@graphorin/cli/interfaces/SecretsRotateOptions.md) |

## Returns

`Promise`\<\{
  `ok`: `true`;
\}\>

## Stable
