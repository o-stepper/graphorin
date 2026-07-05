[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / fileResolver

# Variable: fileResolver

```ts
const fileResolver: SecretResolver;
```

Defined in: packages/security/src/secrets/resolvers/file.ts:56

Resolver for the `file:` scheme. Reads a plaintext file and returns
the trimmed content as a `SecretValue`.

The resolver enforces `chmod 0600` on POSIX systems and emits a
single console warning per process when the file is found at a wider
mode (heuristic: any group/other read or write bits set). Set
`?warnOnPermissions=0` in the URI to opt out - typical when reading
Docker `*_FILE` mounts that intentionally use a tmpfs with a wider
mode.

## Stable
