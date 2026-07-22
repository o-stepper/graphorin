# Third-Party Notices

The Graphorin framework (`@graphorin/*` packages, MIT-licensed,
© 2026 Oleksiy Stepurenko) integrates several third-party software
components at runtime, build-time, and as optional peer dependencies.
Each component is distributed under its own license and is integrated
through public APIs only - the Graphorin source tree does not bundle,
fork, or redistribute any third-party source code.

This file documents the components, their pinned versions, their
licenses (SPDX identifiers), and the role each plays inside Graphorin.
Per-package `package.json` files are the authoritative source for the
exact versions installed in any given build; this file is a
human-readable rollup of the runtime, peer, and optional-peer
dependency surface as of the v0.13.13 release.

---

## Allowlisted licenses

The repository's `pnpm run check-licenses` script enforces the
following SPDX-identifier allowlist on every workspace package and
every transitive runtime dependency:

`MIT`, `Apache-2.0`, `BSD-2-Clause`, `BSD-3-Clause`, `ISC`, `0BSD`,
`Unlicense`, `CC0-1.0`, `CC-BY-4.0`, `BlueOak-1.0.0`, `Python-2.0`.

Anything outside this list requires an explicit PR-level review and a
documented exception in `DEPENDENCY_EXCEPTIONS` inside
[`scripts/check-licenses.mjs`](./scripts/check-licenses.mjs).

### Documented exceptions (v0.13.13)

- The `@img/sharp-libvips-*` family of platform-specific binaries is
  brought in transitively by
  [`sharp`](https://github.com/lovell/sharp), which is in turn a
  transitive dependency of
  [`@huggingface/transformers`](https://github.com/huggingface/transformers.js).
  These binaries wrap `libvips`, distributed under
  **LGPL-3.0-or-later**. Graphorin links against these binaries
  dynamically and never modifies the upstream `libvips` source; the
  LGPL "ability to relink" obligation is satisfied by the upstream
  `@img/sharp-libvips-*` source distribution. This exception is
  audited per-release.
- The `spawndamnit` package (transitive via the Changesets CLI;
  build-time only) declares `"license": "SEE LICENSE IN LICENSE"` -
  inspection of the upstream `LICENSE` file shows the standard MIT
  permission text. Pure manifest-format quirk; not a substantive
  license deviation.
- The `khroma` package (docs-build-time only, transitive via
  `mermaid`'s mindmap renderer) ships no `license` field in its
  manifest; the upstream repository is MIT-licensed. Recorded in
  `DEPENDENCY_EXCEPTIONS` and audited per-release.

---

## Runtime dependencies

### LLM provider layer

| Component | Pin | License | Role inside Graphorin |
|---|---|---|---|
| [`ai`](https://github.com/vercel/ai) (Vercel AI SDK v7) | `^7.0.0-beta.76` | Apache-2.0 | Wrapped by `vercelAdapter` in `@graphorin/provider`; default cloud-LLM driver. |
| [`node-llama-cpp`](https://github.com/withcatai/node-llama-cpp) | `^3.5.0` | MIT | In-process GGUF execution in the `@graphorin/provider-llamacpp-node` companion package. |
| [`js-tiktoken`](https://github.com/dqbd/tiktoken) | `^1.0.0` | MIT | Token counting in `@graphorin/provider`. |

### Persistence + embedding layer

| Component | Pin | License | Role inside Graphorin |
|---|---|---|---|
| [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3) | `^12.9.0` | MIT | Default storage adapter in `@graphorin/store-sqlite`. |
| [`better-sqlite3-multiple-ciphers`](https://github.com/m4heshd/better-sqlite3-multiple-ciphers) | `^12.9.0` | MIT | Optional SQLCipher v4 encryption-at-rest in `@graphorin/store-sqlite-encrypted`. |
| [`sqlite-vec`](https://github.com/asg017/sqlite-vec) | `~0.1.9` | Apache-2.0 OR MIT | Vector-search SQLite extension wired in `@graphorin/store-sqlite`. |
| [`@huggingface/transformers`](https://github.com/huggingface/transformers.js) | `^4.1.0` | Apache-2.0 | Default in-process embedder in `@graphorin/embedder-transformersjs` and the cross-encoder reranker in `@graphorin/reranker-transformersjs`. |

### Standalone server runtime

| Component | Pin | License | Role inside Graphorin |
|---|---|---|---|
| [`hono`](https://github.com/honojs/hono) | `^4.12.25` | MIT | HTTP router for `@graphorin/server` REST + SSE + WebSocket routes. |
| [`@hono/node-server`](https://github.com/honojs/node-server) | `^1.19.0` | MIT | Node.js server adapter for Hono. |
| [`@hono/node-ws`](https://github.com/honojs/middleware) | `^1.3.0` | MIT | WebSocket adapter for the `graphorin.protocol.v1` contract. |

### Observability

| Component | Pin | License | Role inside Graphorin |
|---|---|---|---|
| [`@opentelemetry/api`](https://github.com/open-telemetry/opentelemetry-js) | `^1.9.0` | Apache-2.0 | Tracer / span surface in `@graphorin/observability`. |
| [`@opentelemetry/sdk-node`](https://github.com/open-telemetry/opentelemetry-js) | `^0.217.0` | Apache-2.0 | Node.js OpenTelemetry SDK plumbing for the optional OTLP exporter. |
| [`@opentelemetry/exporter-trace-otlp-http`](https://github.com/open-telemetry/opentelemetry-js) | `^0.215.0` | Apache-2.0 | Optional OTLP-HTTP exporter (only fires when the operator wires a collector URL). |

### Security

| Component | Pin | License | Role inside Graphorin |
|---|---|---|---|
| [`@napi-rs/keyring`](https://github.com/napi-rs/node-keyring) | `^1.2.0` | MIT | OS-keychain backend for `KeyringSecretsStore` in `@graphorin/security`. |
| [`@node-rs/argon2`](https://github.com/napi-rs/node-rs) | `^2.0.2` | MIT | Argon2id KDF for the encrypted-file secrets store in `@graphorin/security`. |
| [`openid-client`](https://github.com/panva/openid-client) | `^6.8.0` | MIT | OAuth 2.1 / PKCE flows in `@graphorin/security/oauth` (used by `@graphorin/mcp` and `@graphorin/cli`). |
| [`isolated-vm`](https://github.com/laverdet/isolated-vm) | `^5.0.0` | ISC | Optional `'isolated-vm'` sandbox tier in `@graphorin/security` (peer dependency; opt-in). |
| [`dockerode`](https://github.com/apocas/dockerode) | `^4.0.0` | Apache-2.0 | Optional `'docker'` sandbox tier in `@graphorin/security` (peer dependency; opt-in). |

### Model Context Protocol

| Component | Pin | License | Role inside Graphorin |
|---|---|---|---|
| [`@modelcontextprotocol/sdk`](https://github.com/modelcontextprotocol/typescript-sdk) | `^1.29.0` | MIT | Underlying MCP client primitives wrapped by `@graphorin/mcp`. |

### CLI / utility layer

| Component | Pin | License | Role inside Graphorin |
|---|---|---|---|
| [`commander`](https://github.com/tj/commander.js) | `^10.0.0` | MIT | CLI argument parsing in `@graphorin/cli`. |
| [`yaml`](https://github.com/eemeli/yaml) | `^2.8.0` | ISC | YAML parsing for SKILL.md frontmatter in `@graphorin/skills`. |

### Peer dependency

| Component | Pin | License | Role inside Graphorin |
|---|---|---|---|
| [`zod`](https://github.com/colinhacks/zod) | `^3.23.0 \|\| ^4.0.0` | MIT | Schema validation; declared as a non-optional peer dependency by every `@graphorin/*` package that touches a public schema. |

### Bundled pricing dataset

| Component | Pin | License | Role inside Graphorin |
|---|---|---|---|
| [`@pydantic/genai-prices`](https://github.com/pydantic/genai-prices) | bundled snapshot | MIT | Bundled snapshot of LLM pricing data; refreshed on demand by `graphorin pricing refresh` (DEC-151). The framework never refreshes it automatically. |

### Pluggable opt-in components

The following components are NOT installed by default. They become
required when the operator opts into the corresponding `@graphorin/*`
sub-pack or trigger.

- The `@graphorin/eslint-plugin` package declares `eslint @ >=9.0.0`
  as a peer dependency for projects that consume the lint ruleset.
- The `@graphorin/embedder-ollama` and the `ollamaAdapter` /
  `llamaCppServerAdapter` / `openAICompatibleAdapter` paths in
  `@graphorin/provider` talk to remote daemons (Ollama, llama.cpp's
  upstream `llama-server`, LM Studio, LocalAI, vLLM, Together.ai, …)
  over HTTP. Those daemons are external software components installed
  and operated by the user; their licenses, security baselines, and
  network behaviour are documented by their respective upstreams.

---

## Build-time dependencies

The repository's build, lint, test, and release tooling depends on
the following devDependencies. None of them ship in the published
`@graphorin/*` artifacts.

| Component | Pin | License | Role |
|---|---|---|---|
| [`typescript`](https://github.com/microsoft/TypeScript) | `^5.7.0` | Apache-2.0 | Type-checking + declaration emission. |
| [`tsdown`](https://github.com/rolldown/tsdown) | `^0.16.0` | MIT | Per-package ESM bundler used by every `@graphorin/*` package's `build` script. |
| [`tsx`](https://github.com/privatenumber/tsx) | `^4.20.0` | MIT | TypeScript-aware Node.js runner for examples + scripts. |
| [`turbo`](https://github.com/vercel/turborepo) | `^2.9.14` | MPL-2.0 | Monorepo task runner used by `pnpm build` / `pnpm test` / `pnpm typecheck` (build-time only; not redistributed). |
| [`vitest`](https://github.com/vitest-dev/vitest) | `^3.2.6` | MIT | Test runner across every workspace package. |
| [`@vitest/coverage-v8`](https://github.com/vitest-dev/vitest) | `^3.2.4` | MIT | Coverage reporter for `vitest`. |
| [`@biomejs/biome`](https://github.com/biomejs/biome) | `^2.0.0` | MIT | Lint + format (single tool, replaces Prettier + ESLint duo for the framework itself). |
| [`@changesets/cli`](https://github.com/changesets/changesets) | `^2.27.10` | MIT | Versioning + changelog automation; drives `pnpm release` on the GitHub Actions release workflow. |
| [`@types/node`](https://github.com/DefinitelyTyped/DefinitelyTyped) | `^22.10.0` | MIT | Node.js type definitions. |
| [`rimraf`](https://github.com/isaacs/rimraf) | `^6.0.1` | ISC | Cross-platform `rm -rf` for the per-package `clean` script. |

---

## Code of Conduct text

[`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md) reproduces the unmodified
text of the Contributor Covenant v2.1, which is licensed under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

---

## Reporting an attribution issue

If you believe a third-party component is missing from this file, or
that the role described above misrepresents how Graphorin uses it,
please [open a GitHub Issue](https://github.com/o-stepper/graphorin/issues)
or email the project maintainer at <step.oleksiy@gmail.com> if the issue
is security-sensitive.

---

**Project Graphorin** · v0.13.13 · MIT License · © 2026 Oleksiy Stepurenko · <https://graphorin.com> · <https://github.com/o-stepper/graphorin>
