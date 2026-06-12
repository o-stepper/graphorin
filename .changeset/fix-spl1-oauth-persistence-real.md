---
'@graphorin/security': patch
'@graphorin/cli': patch
'@graphorin/mcp': patch
---

fix(security): OAuth token persistence is real — tokens live in the SecretsStore, refresh/revoke survive restarts (SPL-1 / SPL-16 / SPL-12)

The `keyring:oauth:*` refs were phantom: `persistSession` recorded them but no
token was ever written anywhere, `refreshOAuthSession` always built a client
with an empty in-memory map (so `auth refresh` was guaranteed to throw in a
fresh process), `revokeOAuthSession` skipped the RFC-7009 call entirely and
audited **success** while the token stayed valid on the AS, and the MCP bridge
could never issue an Authorization header.

- **SPL-1** — `createOAuthClient({ secretsStore })`: `persistSession` writes
  the access/refresh/id tokens under the `oauth:<serverId>:<kind>` keys the
  refs point at; refresh/revoke/status resolve them back (with in-memory
  caching). `refreshOAuthSession` / `revokeOAuthSession` /
  `listOAuthSessions` / `getOAuthStatus` / `loginInteractive` accept
  `secretsStore`; `hasAccessToken`/`hasRefreshToken` report `true` only when
  the ref actually resolves. The CLI `auth` commands resolve the active
  secrets store (auto chain) and thread it through; the MCP bridge accepts
  `secretsStore` so headers work across restarts.
- **SPL-16** — honest failure reporting: `revokeOAuthToken` now **throws** on a
  missing revocation endpoint, network failure, or non-2xx response;
  `client.revoke` still tears down locally (documented) but audits
  `decision: 'error'` with `serverRevoked: false` when the server did not
  confirm — never a success lie. The read-only `EnvSecretsStore.set/delete`
  no-ops audit as `denied` instead of `success`.
- **SPL-12** — inert options fixed: `callbackTimeoutMs` has the documented
  real 5-minute default (no more waiting forever); a caller-supplied
  `redirectUri` rejects **before** opening a browser the user would dead-end
  in; `refresh({ force: true })` genuinely bypasses the in-flight dedupe;
  `refreshAheadMs` docs state the real semantics (status labels on the
  client; the proactive refresh lives in the MCP bridge provider).

Docs: `secrets.md` gains "Where OAuth tokens live"; `cli.md` documents the
now-working `auth refresh` / `auth revoke`.
