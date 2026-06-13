---
title: Privacy & no-phone-home
description: Zero version pings, zero analytics, zero auto-update calls. The only outbound traffic Graphorin generates is the traffic your code initiates. Verified by a CI check.
---

# Privacy & no-phone-home

Graphorin makes **zero implicit network calls**. The only outbound traffic the framework generates is the traffic your code initiates explicitly:

- LLM provider API calls (`@graphorin/provider`).
- MCP server connections (`@graphorin/mcp`).
- OAuth flows (`@graphorin/security/oauth`).
- The opt-in pricing-snapshot refresh (`graphorin pricing refresh`).
- Embedder model downloads on first use (`@graphorin/embedder-transformersjs`).
- Storage backend connections (only when an external store is configured).
- The optional OTLP-HTTP exporter (only when the operator wires a collector URL).

There is **no telemetry**, **no version pings**, **no analytics**, **no crash uploads**, and **no auto-update** behaviour anywhere in the framework.

## Verified by CI

The repository ships a `pnpm run check-no-network` script that scans every published package's source tree for forbidden network primitives (`fetch`, `http.request`, `https.request`, `http.get`, `https.get`, `net.createConnection`, `net.connect`, `tls.connect`, `dgram.createSocket`, `WebSocket`, plus imports of `node-fetch` / `undici` / `got` / `axios` / `ky`). The check fails the build the moment a non-allow-listed network call is introduced.

The allow-list is small and explicit:

| Allow-listed area | Why |
|---|---|
| Provider adapters (`packages/provider/`) | Explicit user-initiated LLM calls. |
| MCP transports (`packages/mcp/`) | Explicit user-initiated MCP connections. |
| OAuth flows (`packages/security/src/oauth/`) | Explicit user-initiated authorisation. |
| Skill installer + signature verifier | Explicit user-initiated skill install. |
| Embedder model downloads (`packages/embedder-*/`) | Explicit user-initiated embedder bootstrap. |
| Storage backends (`packages/store-*/`) | Explicit user-configured external storage. |
| OTLP-HTTP exporter | Only when the operator wires a collector URL. |
| Pricing refresh | Only on `graphorin pricing refresh` invocation. |

The CI workflow that runs the check is [`.github/workflows/check-no-network.yml`](https://github.com/o-stepper/graphorin/blob/main/.github/workflows/check-no-network.yml).

## Local-first defaults

| Subsystem | Default behaviour |
|---|---|
| Storage | SQLite file on the user's disk. No remote DB. |
| Embedder | `@huggingface/transformers` running fully in-process. Models downloaded once on first use. |
| Provider | None until you configure one. |
| Tracer | Console exporter (when `GRAPHORIN_TRACE=console` is set) or no exporter at all. |
| Audit log | Encrypted SQLite file on disk. |
| Secrets | OS keychain (when available). |
| Updates | Manual. Graphorin never pings npm or any other endpoint to check for new versions. |

## Sensitivity-aware payloads

`createProvider(adapter, { acceptsSensitivity })` is the **first-run sensitivity prompt**. The default for an unfamiliar provider is **deny everything except `public`** until you opt in. Memory rows tagged `secret` are filtered before any payload reaches the adapter, regardless of the configuration.

Sensitivity governs *who may see* a memory. It is orthogonal to **provenance / quarantine**, which governs *whether a memory is trusted enough to recall at all* — synthesised or injection-flagged rows are quarantined out of recall until a human validates them. See [Security § Memory safety](/guide/security#memory-safety-provenance-quarantine).

## Verifying the contract yourself

Set `GRAPHORIN_OFFLINE=1` and run any of the example apps in the repository. The runtime refuses to phone home; recipes that try to reach a configured local endpoint (e.g. an Ollama daemon) emit a typed `OfflineRecipeUnreachableError` with a helpful remediation message.

```bash
GRAPHORIN_OFFLINE=1 GRAPHORIN_LLM_RECIPE=stub \
  pnpm --filter ./examples/personal-assistant-cli dev
```

Network sniffers (`lsof -i -nP | grep node`, `tcpdump`, `Wireshark`) should show traffic only to the endpoints you explicitly configured — never beyond.

## Reporting a regression

If you believe you have observed Graphorin making a network call that the runtime did not invite, please open an issue on GitHub or report it privately per the [Security policy](/contributing/security).

## Next steps

- [Security](/guide/security) — sandbox + audit log + supply chain.
- [Observability](/guide/observability) — redaction layer.
- [Standalone server](/guide/standalone-server) — health checks + Prometheus metrics.

---

**Graphorin** · v0.5.0 · MIT License · © 2026 Oleksiy Stepurenko
