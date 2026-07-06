---
'@graphorin/mcp': minor
---

W-016/W-140: MCP server identity is transport-derived by default; scoped handles are colon-safe.

`serverIdentity.id` previously defaulted to the name the remote server self-reported on `initialize` - and every security surface keys off that id: TOFU pins in the pinStore (a rug-pull server minted a fresh record by renaming itself), `mcp:<id>:<uri>` handle scoping (a malicious server claiming a trusted name had its resource_links resolve under the trusted scope), taint labels and audit rows. The id now derives ONLY from the operator-controlled transport config plus the explicit `serverInfoName` override; HTTP-family ids include a non-default port (localhost:3001 and :3002 no longer collide). The self-reported name survives as display-only `reportedServerName`. Because ':' is now routine in ids, `scopedResourceHandle` percent-encodes the id segment and the reader decodes before matching (handles are ephemeral - no migration). MIGRATION: pinStore records keyed by old server-controlled ids orphan and TOFU re-pins under the transport id on first `toTools()` - operators running `onPinMismatch: 'reject'` must re-pin; registry auto-prefix namespaces (derived from the identity) may change model-visible prefixed tool names.
