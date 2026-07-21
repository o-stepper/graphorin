[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / createSecretsHealthRoutes

# Function: createSecretsHealthRoutes()

```ts
function createSecretsHealthRoutes(): Hono<{
  Variables: ServerVariables;
}>;
```

Defined in: packages/server/src/health/routes.ts:74

**`Stable`**

Authed health route. Mounted at `${base}/health/secrets` AFTER the
auth middleware so the scope check has a verified token to inspect.
Returns the active secrets store + fallback chain + downgrade
reason per the secrets capability matrix.

## Returns

`Hono`\<\{
  `Variables`: [`ServerVariables`](/api/@graphorin/server/interfaces/ServerVariables.md);
\}\>
