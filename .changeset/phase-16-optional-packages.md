---
'@graphorin/store-sqlite-encrypted': minor
'@graphorin/secret-1password': minor
'@graphorin/reranker-transformersjs': minor
'@graphorin/reranker-llm': minor
'@graphorin/evals': minor
'@graphorin/eslint-plugin': minor
'@graphorin/cli': minor
---

Phase 16 — Optional packages. Six new opt-in packages join the framework
alongside the existing core surface; none of them are on the v0.1
critical path but they round out the cloud-friendly / production
deployment story documented in the architecture sources.

`@graphorin/store-sqlite-encrypted` (NEW) — encryption-at-rest sub-pack
for the default SQLite store. Pulls `better-sqlite3-multiple-ciphers@^12.9.0`
as a required peer dep and exposes:

- `createEncryptedConnection({ path, encryption })` — convenience
  wrapper around `openConnection` that pre-loads the cipher peer and
  fails fast with `EncryptedStorePeerMissingError` when the native
  addon is absent.
- `encryptDatabase({ sourcePath, targetPath, passphrase, cipher?, swap?, overwriteTarget? })`
  — converts an unencrypted DB into an encrypted one via
  `ATTACH DATABASE ... KEY` + `sqlcipher_export`, runs
  `PRAGMA cipher_integrity_check` post-write, and optionally swaps the
  encrypted output into the source path with a timestamped
  `.bak.<ts>` of the original.
- `rekeyDatabase({ path, oldPassphrase, newPassphrase, cipher? })` —
  rotates the cipher key in place via `PRAGMA rekey` + post-rotation
  integrity check.
- `cipherIntegrityCheck(connection)` — read-only pragma runner safe
  for the daily triggers cron.
- `DEFAULT_CIPHER`, `pragmaSequenceForCipher`, `encodePassphraseForPragma`,
  `loadCipherPeer`, `EncryptedStorePeerMissingError` — cipher-config
  helpers re-exposed for advanced setups.

The companion CLI runners (`graphorin storage encrypt --passphrase-from <ref>`
and `graphorin storage rekey --old-passphrase-from <ref> --new-passphrase-from <ref>`)
become operational once this sub-pack is installed; until then they
exit `2` (`UNSUPPORTED`) with an actionable hint.

`@graphorin/secret-1password` (NEW) — reference 1Password
secret-resolver adapter that registers the `op://` scheme on top of
`@graphorin/security`'s pluggable `SecretResolver` registry by shelling
out to the official 1Password CLI:

- `createOnePasswordResolver({ cli?, binary?, timeoutMs?, serviceAccountToken?, connect?, account?, preserveCase? })`
  — factory returning a `SecretResolver`.
- `onePasswordResolver` — pre-built default-options instance.
- `createDefaultOpCli` + `OpCliError` + `OpCliErrorKind` (`'binary-missing'`
  / `'signed-out'` / `'reference-not-found'` / `'timeout'` / `'unknown'`)
  — typed wrapper around `op read --reveal`.

The package is the canonical template community packages should follow
when wiring HashiCorp Vault, AWS Secrets Manager, GCP Secret Manager,
Azure Key Vault, Bitwarden, or Unix `pass`.

`@graphorin/reranker-transformersjs` (NEW) — cross-encoder reranker
adapter that wraps `@huggingface/transformers@^4.1.0` to score
`(query, passage)` pairs in-process:

- `createCrossEncoderReranker({ locale?, model?, dtype?, batchSize?, idleEvictionMs?, passageExtractor?, ... })`
  — locale-aware default model selection (`'en'` /
  `'en-*'` → `Xenova/bge-reranker-base`; every other locale →
  `BAAI/bge-reranker-v2-m3`); operators target language-specific
  cross-encoders by passing an explicit `model`.
- `TransformersJsReRanker` — the underlying class implementing the
  `ReRanker` contract from `@graphorin/memory/search`. Lazy-loaded
  pipeline; optional idle-eviction timer that drops the loaded ONNX
  session after the configured idle window.
- `pickRerankerModel`, `mergeAndDedupe`, `extractPairScores`,
  `defaultPassageExtractor` — pure helpers exposed for tests +
  custom integrations.
- `RERANKER_ID = 'transformersjs-cross-encoder'` and
  `CrossEncoderLoadError` — observability surface.

`@graphorin/reranker-llm` (NEW) — LLM-as-reranker adapter that asks
the configured `Provider` to emit a single integer relevance score
per `(query, passage)` pair and runs scoring in parallel batches via
`Promise.all()`:

- `createLlmReranker({ provider, maxScore?, batchSize?, scoringPrompt?, passageExtractor?, ... })`
  — defaults `temperature: 0` (deterministic), `batchSize: 5`,
  `maxScore: 10`. Default English scoring prompt is locale-agnostic
  and translatable; operators that target a different locale pass
  `scoringPrompt: <localised builder>`.
- `LlmReRanker` — the underlying class implementing the `ReRanker`
  contract from `@graphorin/memory/search`. Attaches `llm_score` +
  `llm_score_norm` signals alongside any pre-existing signals.
- `parseIntegerResponse`, `normalizeScore`, `mergeAndDedupe`,
  `defaultScoringPrompt`, `defaultPassageExtractor` — pure helpers
  exposed for tests + custom integrations.
- `RERANKER_ID = 'llm-judge'`.

`@graphorin/evals` (NEW) — full eval framework decoupled from the
`@graphorin/observability` inline runner per RB-17 / DEC-152:

- **Parallel runner** (`runEvals({ agent, dataset, scorers, iterations?, concurrency?, signal?, onProgress? })`)
  with bounded worker-pool concurrency, per-case `onProgress` heartbeat,
  and `signal` propagation to `agent.run(...)`.
- **Scorer libraries**:
  - `code/`: `exactMatch`, `regexMatch`, `jsonPath`, `predicate`.
  - `llm/`: `llmJudge` (LLM-as-judge with deterministic scoring + clamping).
  - `prebuilt/`: `toxicityScorer`, `factualityScorer`, `helpfulnessScorer`
    — wrap `llmJudge` with project-tested rubrics.
- **Dataset loaders**:
  - `loadJsonlDataset(path)` / `parseJsonl(text)` — JSONL with optional
    custom `mapper`; line-numbered error reporting.
  - `loadCsvDataset(path)` / `parseCsv(text)` — RFC 4180 strict subset
    with quoted-cell + escaped-quote handling.
  - `loadDatasetFromTraces(path, { extract })` / `groupAndExtract(text, { extract })`
    — distil a dataset from the framework's replay log by grouping
    events on `runId` and applying a caller-supplied extractor.
  - `fromIterable(cases)` — wrap an array / generator as a `Dataset`.
- **Reporters**: `renderTerminalReport` (plain text), `renderMarkdownReport`,
  `renderJsonReport({ pretty? })`, `renderJunitReport({ suiteName? })`,
  `renderHtmlReport({ title? })` — every renderer takes an `EvalReport`
  and returns the canonical text representation; the caller decides
  where to write it.
- **Regression detection** (`detectRegressions(current, baseline, options?)`)
  flags pass-rate drops, per-scorer avg-score drops, avg-duration
  increases, and removed scorers against configurable tolerances
  (defaults: 5 pp pass-rate / 0.05 avg-score / 250 ms duration).
- **CLI helpers**: `exitOnFailures(report, regression?)` flips
  `process.exitCode` so `node ./eval-script.mjs` exits non-zero on
  failure or regression. `writeReports({ report, outDir, formats: ReporterFormat[] })`
  renders the report in every requested format and writes them to disk
  with a manifest of `{ format, path, bytes }` records.

`@graphorin/eslint-plugin` (EXTENDED) — Phase 16 ruleset additions on
top of the existing scaffolds and the three `tool-*` rules:

- `@graphorin/no-secret-unwrap` (DEC-020 / ADR-026) — flags
  `.unwrap()` and `.reveal()` calls on `SecretValue`-shaped
  expressions. `.unwrap()` is reported as `'error'` regardless of
  comments (the method is `@deprecated`); `.reveal()` honours an
  adjacent `// graphorin-allow-secret-unwrap: <reason>` opt-out.
  Active for the first time — supersedes the v0.1 scaffold.
- `@graphorin/no-secret-in-deps` (DEC-137) — flags
  `Agent.toTool({ inheritSecrets: [...] })` calls with a non-empty
  allowlist that lack an `// rb-24-justification: <reason>` comment.
- `@graphorin/provider-middleware-order` (DEC-145 / ADR-039) —
  lint-time enforcement of the canonical
  `withTracing → withRetry → withRateLimit → withCostLimit → withCostTracking → withFallback → withRedaction`
  ordering; mirrors the runtime `MiddlewareOrderingError`.
- `@graphorin/no-implicit-network-call` (DEC-154 / ADR-041) — flags
  bare `fetch(...)` / `axios.get(...)` / `https.request(...)` /
  `new XMLHttpRequest()` invocations in `@graphorin/*` framework
  code without an explicit `// graphorin-allow-network: <reason>`
  opt-out.
- `@graphorin/no-third-party-workflow-aliases` (DEC-019 / ADR-029) —
  flags third-party workflow primitive identifiers in
  `@graphorin/workflow` source so the package never reuses external
  library names; per-occurrence opt-out comment available.
- `@graphorin/no-bare-tool-exec` (principle 3 / DEC-143) — flags
  `tool({ execute })` functions that do not reference `signal`, so
  long-running tools always propagate the cancellation contract.
- `@graphorin/tool-parameter-naming` — extended to surface
  `numericSuffix` findings (`arg1`, `param2`, …) alongside the
  existing ambiguous-identifier check, and now honours per-tool
  opt-out via `tags: ['experimental']` / `tags: ['legacy']` so
  long-tail tools can defer the rename without breaking calling
  code.

The bundled `recommended` config wires every active rule at sensible
severities (`'error'` for security / supply-chain rules; `'warn'`
for stylistic ones).

`@graphorin/cli` extension — `runStorageEncrypt` and `runStorageRekey`
now dynamic-import `@graphorin/store-sqlite-encrypted` when present and
delegate to its `encryptDatabase` / `rekeyDatabase` runners (resolving
the passphrase through the existing `@graphorin/security` resolver
chain). When the sub-pack is absent the CLI still exits `2` with an
actionable hint pointing operators at the new package.

`@graphorin/protocol` and `@graphorin/client` (no source change) —
existing packages from Phase 14b. Bundle sizes verified again under
the published-package budget: `@graphorin/protocol` ≈ 5.85 KB
minified-gzipped (target < 10 KB); `@graphorin/client` ≈ 11 KB
minified-gzipped (target < 50 KB). Both packages set
`publishConfig: { access: 'public', provenance: true }`.

`@graphorin/provider-llamacpp-node` (no source change) — existing
companion package from Phase 06. Bundle ≈ 4 KB minified-gzipped;
required peer dep `node-llama-cpp@^3.5.0`; `engines.node: '>=22.0.0'`
(Node-only, intentionally not browser / edge compatible per the
in-process GGUF execution model). README documents the recommended
GGUF publishers (`huggingface.co/ggml-org`, `huggingface.co/TheBloke`,
`huggingface.co/bartowski`, `huggingface.co/unsloth`, `huggingface.co/Qwen`)
and the SHA-256 verification procedure per RB-56 § GGUF model
provenance.

Repository hygiene:

- **Total new tests:** 246 across the new packages
  (`store-sqlite-encrypted`: 34; `secret-1password`: 19;
  `reranker-transformersjs`: 34; `reranker-llm`: 30;
  `evals`: 67; `eslint-plugin`: 42 new + 16 existing; `cli`: +1).
- Every new package ships:
  - README with installation + usage + acceptance-criteria walkthrough.
  - CHANGELOG seeded for the v0.1.0 release.
  - LICENSE (MIT) crediting Oleksiy Stepurenko.
  - `publishConfig: { access: 'public', provenance: true }`.
  - Coverage thresholds: ≥ 75 % lines / functions / statements (≥ 70 %
    branches) for utility packages, ≥ 80 % for the framework-critical
    surfaces.
  - Builds via `tsdown` to ESM-only `dist/` honouring the existing
    `preserveModules` convention so consumer bundlers tree-shake
    unused exports.
- `pnpm exec biome check`, `pnpm typecheck`, `pnpm test`, `pnpm build`,
  and `pnpm run check-no-network` all pass cleanly across the affected
  packages.

Phase 17 (examples + benchmarks) and Phase 18 (release v0.1) attach to
the publishable surfaces introduced here.
