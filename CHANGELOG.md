# Graphorin - Changelog

All notable changes to the Graphorin framework are documented in this
file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
(pre-1.0: minor bumps may carry breaking changes; patch bumps do not).

Per-package changelogs live in each package's `CHANGELOG.md`.

> **Publication note.** Versions `0.1.0`-`0.4.0` were lockstep version
> milestones developed in the open; public npm publication of the
> `@graphorin` scope (with [Sigstore](https://www.sigstore.dev/) build
> provenance) begins with `0.5.0`.

---

## 0.15.1 - 2026-07-22

A one-fix patch, found by the 0.15.0 published-surface smoke minutes
after the release went out.

- **`createRequestTimeout` no longer `unref`s its deadline timer**,
  matching the HTTP adapters' timer semantics. An armed deadline now
  keeps the event loop alive, so a call whose transport holds no
  handle of its own (fixture-driven overrides, bare one-shot scripts)
  fails with the honest timeout error instead of the process draining
  and exiting mid-call with an unsettled top-level await. Real network
  transports were never affected - their sockets ref the loop - which
  is exactly why every in-repo test passed while a bare npm consumer
  script surfaced it. A subprocess regression test now pins the loop
  semantics (a bare `node` child arming a deadline must observe it
  fire, not exit silently).

Alongside the patch (no package code, so no version implications), the
repo closed the last no-spend 1.0 residue of the 0.13.12 assessment:
a weekly reproducible local-model baseline leg (pinned Ollama +
qwen3:0.6b, published-not-gated with the evidence stamps asserted), the
1-hour soak dispatch envelope with a published-runs table, hard
owner/expiry on every security-exception allowlist entry, the
docs-command sweep widened from cli.md to README + every guide page
(which immediately found and fixed a parser attribution gap), and a
per-case wall clock for the LongMemEval runner (`--case-timeout-ms`).

## 0.15.0 - 2026-07-22

The **proof minor** (PR #249): the residue of the 0.13.12 overall
assessment after 0.14.0 - the four fronts a framework needs between
"the code is right" and "you can bet an evening on it": a paved user
path, one recovery semantics across every provider, operational claims
a CI runner re-earns weekly, and benchmark reports that carry their own
evidence. Two of the new gates paid for themselves before the release
existed: the soak leg exposed a wire-contract inconsistency (a busy
agent instance answered `500 run-failed` on the run route but
`409 agent-busy` on the resume route), and the systemd verify gate
found the template's restart rate-limit sitting in a section where
systemd silently ignores it.

- **Golden paths.** Three verified guide pages - a local agent in 10
  minutes (Ollama, a custom tool, memory across restarts, expected
  output), a production API server (scaffold to `curl` proof, with the
  demo-vs-production checklist), and safe code execution (DockerSandbox
  threat model, worked example, enforced-limits table, explicit
  out-of-scope list). Every fence passes the snippet type-checker.
- **One provider recovery semantics.** `withRetry` and `withFallback`
  now share one exported predicate, `isRetryableProviderFailure`
  (previously two hand-maintained copies); `readRetryAfterMs` is
  exported beside it and `ProviderHttpError` stamps a first-class
  `retryAfterMs` from a numeric `Retry-After` header. The two adapters
  without a timeout knob gained an opt-in `timeoutMs` - `vercelAdapter`
  (time to first chunk / whole `generate()`) and `llamaCppNodeAdapter`
  (time to first token, model load included) - both surfacing expiry as
  the same retryable `ProviderHttpError{ status: 0 }` shape the HTTP
  adapters throw, never as a silent abort. Provider idempotency
  semantics are now written down (calls are not idempotent; replay
  protection lives at the server's `Idempotency-Key` boundary).
- **Operational claims CI re-earns.** The weekly Docker smoke gained a
  crash-resume drill: a workflow run parked on a durable timer survives
  `docker kill` (SIGKILL) and completes after restart with no operator
  action (first CI run: resumed 14 s after boot). A new weekly soak leg
  drives paced load through the full agent-turn path against a stub
  provider and gates on published SLOs - first CI run: 300 s at
  305 req/s, 91,534/91,534 responses `200`, p95 4.3 ms, RSS peak
  225 MB. Per-PR, the k8s manifest now validates under kubeconform
  `-strict` and the systemd unit under `systemd-analyze verify` plus an
  offline security score gated below 5 (currently 1.6). The operations
  guide gained the honest scaling model (single-writer: scale up or
  partition, availability = fast restore) and the SLO table.
- **`409 agent-busy` everywhere.** `POST /v1/agents/:id/run` on a busy
  single-flight agent instance now answers `409` with
  `error: 'agent-busy'` (the mapping the resume route always had)
  instead of `500 run-failed` - contention to pace or route around,
  not a server fault. The error-contract page documents it; deploy an
  instance pool for parallel turns.
- **Benchmark reports carry their own evidence.** `benchConfig` pins
  the dataset (`datasetPath` + `datasetSha256`) and the exact
  `subjectSpec`/`judgeSpec` model identities; the LLM judge persists
  its raw reply (`metadata.judgeText`); the markdown/terminal reporters
  render the Wilson 95% CI and `pass^k` the runner always computed, so
  a 3-case smoke reads as `100.0% (95% CI 43.9%-100.0%, n=3)`, never
  as a bare 100%. `--think` generalizes to effort levels, `--num-ctx`
  lands, and the HaluMem runner reaches knob parity.
- **systemd template fix.** `StartLimitIntervalSec`/`StartLimitBurst`
  moved from `[Service]` (where systemd silently ignores them - the
  restart rate-limit never applied) to `[Unit]`; the new verify gate
  fails on any silently-ignored key from here on.

## 0.14.0 - 2026-07-22

The **consolidation minor** (PR #247): the follow-up to the fifteenth
external review, an overall assessment that scored the project
"production-capable beta, 7.5/10" and whose remaining critique was not
features but PROOF - a production-shaped container, a written
stability contract, and operational runbooks that CI actually
exercises. This release ships exactly that, and the new backup/restore
drill immediately earned its keep by catching a real bug before it
could reach an operator: `graphorin storage backup` on an encrypted
store had never worked (the page-level backup API cannot key either
side of the transfer, so the cipher driver refused with a cryptic
"incompatible source and target databases" error).

- **Encrypted backups are real now.** On an encrypted store,
  `storage backup` takes a consistent **stopped-server byte copy**:
  checkpoint the WAL, prove no other holder is live (a running server
  gets a clear live-writer refusal instead of a torn copy), copy,
  then verify the copy's cipher integrity. Plaintext stores keep the
  online page-level path. New `backupEncryptedDatabase` +
  `EncryptedBackupLiveWriterError` exports in
  `@graphorin/store-sqlite-encrypted`; a real-peer regression test
  pins the naive-path failure so the byte-copy rationale stays honest.
- **Lean production image.** The Docker template's runtime stage now
  ships the production dependency closure only - **298 MB measured
  against 1.05 GB** before. The builder does the full workspace
  build, promotes the runtime pieces the workspace dev-satisfies (the
  SQLite natives, the cipher peer, the encrypted-store sub-pack, the
  agent runtime, per-package zod), wipes `node_modules`, reinstalls
  just the CLI subtree with `--prod`, and strips source/test trees.
  grype reports no vulnerabilities at the gate settings; dockerode,
  isolated-vm and `@graphorin/mcp` become documented derived-image
  add-ons (registry consumers never received them by default either).
- **Key rotation is fully tooled.** New `graphorin secrets rekey
  --new-passphrase-from <ref>` re-encrypts the encrypted-file secrets
  bundle under a new passphrase (fresh KDF salt, values unchanged;
  exit `2` for sources without a bundle passphrase), backed by
  `EncryptedFileSecretsStore.rekey()` and a `secret:rekey` audit
  action - completing the set: `storage rekey` for the database key,
  `token rekey` for the pepper, `secrets rotate` for individual
  values, `secrets rekey` for the bundle.
- **The contract is written down.** Three new guide pages - Stability
  & versioning (tiers, deprecation policy, supported platforms,
  artifact compatibility, the road to 1.0), Error contract (the
  `code`/`kind` families, per-package bases, provider HTTP
  classification, server wire formats, what is and is not
  contractual), and Operations runbooks (backup, restore, upgrade,
  rollback, key rotation - each with its CI proof; the weekly Docker
  smoke now runs the full backup -> destroy-volume -> restore ->
  data-survives drill). The Providers guide gained a per-adapter
  capability matrix. Two stragglers were reparented so the error
  contract holds: `ToolRateLimitError` joins `GraphorinToolsError`
  (kind `'rate-limited'`), `TimerDriverStoreUnsupportedError` joins
  `WorkflowError` (code `'timer-driver-store-unsupported'`), and the
  `AgentRuntimeError` / `SessionError` bases now thread `{ cause }`.

## 0.13.13 - 2026-07-22

The **dependency + benchmark-integrity patch** (PR #244): remediation of
the fourteenth external deep retest, which verified every 0.13.12 fix
live (single-flight recovery measured at exactly 11 cold HTTP calls in
five independent processes) and then swept the remaining functional and
security surfaces. It found no P0; the two P1s it did find - a batch of
dependency advisories published hours after 0.13.12 shipped, and a
benchmark runner that could exit green after infrastructure failures -
are closed here together with the verified P2/P3 batch. No breaking
changes; one hardening default changed (Docker sandbox user, below).

### Dependency advisory closure (`@graphorin/server`, transformers.js adapters)

- `@graphorin/server` moves `@hono/node-server` to 2.x
  (GHSA-frvp-7c67-39w9, Windows path traversal in `serve-static`). The
  vulnerable entry point was never imported - a tripwire test now keeps
  it that way - and the MCP-SDK-side 1.x copy is overridden to 2.x in
  the workspace lockfile.
- `fast-uri` (two host-confusion highs) and `dompurify` (low) are closed
  by override-driven lockfile refresh.
- The `sharp` high under `@huggingface/transformers`
  (GHSA-f88m-g3jw-g9cj, inherited libvips image-decoding CVEs) gets the
  adm-zip treatment: the workspace runs `sharp@0.35.x` via a pnpm
  override, both adapter READMEs and the security guide document the
  consumer-side override (`sharp` is the IMAGE-input path; Graphorin's
  adapters are text-only, so the vulnerable decode paths are not
  reachable through Graphorin APIs - but `npm audit` is red for every
  consumer until the override is applied), and the published-peer-audit
  allowlist gains a reviewed entry whose mitigation is verified against
  the live registry on every scheduled run.

### Benchmark integrity - infrastructure failures can no longer exit green (`@graphorin/evals`, LongMemEval/HaluMem runners)

- Live finding: two 120-second provider timeouts were stored as ordinary
  failed answers, and `--gate-on regressions` without a baseline exited
  0 - automation saw a green benchmark process while the evaluated
  system produced no answers. The eval runner's `agent.run threw:`
  reason prefix is now the exported stable `AGENT_RUN_THREW_MARKER`, and
  the LongMemEval runner classifies such cases as
  `INFRASTRUCTURE_FAILED` (and judge off-format exhaustion as
  `JUDGE_FAILED`), forcing a non-zero exit in BOTH gate modes with case
  ids stamped into `benchConfig`.
- Recovered judge retries are now telemetry: `llmJudge` marks them
  `judge-retries: N` (exported `JUDGE_RETRY_MARKER`) in the score reason
  and `metadata.judgeRetries`, and both runners report
  `judgeRetriedCases` - a recovered grade is a real grade, but its extra
  billed call is no longer invisible.
- Every persisted case result echoes the dataset's reference answer
  (`EvalCaseResult.expected`), so a failed case can be adjudicated from
  the report alone.
- Runner UX: `--think true|false` exposes the subject-leg Ollama
  reasoning override (previously programmatic-only; thinking-default
  local models answered EMPTY on CLI defaults), `--timeout-ms` raises
  the per-request adapter timeout for slow local full-context runs, and
  a credentials preflight accepts `OPENAI_API_KEY` for the official
  OpenAI endpoint while failing a keyless official-endpoint run BEFORE
  the first case instead of burning every case as HTTP 401.

### Docker sandbox hardening (`@graphorin/security`, `@graphorin/sessions`)

- `DockerSandbox` containers no longer run as the image's default user
  (root in most bases): the create request now sets `User: '10001:10001'`
  by default with the `/work` tmpfs owned by that uid, plus a PID
  ceiling (`pidsLimit`, default 128) and a CPU allowance (`cpus`,
  default 1). All three are `createDockerSandbox` options; live
  negative tests prove the uid, the rootfs/network denials, and the
  pids cgroup ceiling on a real daemon. Set `user: ''` to restore the
  old behaviour for images that require it.
- AES-GCM call sites (sessions export, encrypted-file secret
  store/resolver) pass an explicit `authTagLength: 16` - behaviour
  unchanged, invariant now self-documenting.

### Repository and CI hygiene

- The gitleaks allowlist shrinks from the whole `packages/*/tests/`
  tree to six exact fixture files - a real secret under a test path is
  no longer invisible to CI - and the CLI test suite stops printing a
  synthetic token-shaped value into logs.
- integration-real installs Ollama from a checksum-verified versioned
  release artifact instead of piping a mutable remote installer to sh.
- The Docker smoke workflow now FAILS on fixable critical/high
  advisories in the exact image SBOM (pinned grype); to keep that gate
  meaningful the runtime image applies Debian security updates at build
  time and drops the npm/corepack toolchain. Its secrets recipe (and
  the documented one) becomes warning-free: bind-mounted secrets owned
  by uid 10001 at mode 0400.
- A new `check-benchmark-readmes` CI gate validates documented
  benchmark commands (the multilingual LOCOMO README shipped a runner
  path whose package directory does not exist); `pnpm
  check-package-shape` becomes a root alias; dependabot gains a 7-day
  cooldown and renovate a `minimumReleaseAge` (security updates exempt
  in both).
- Yarn PnP: an optional `zod` peer is propagated through 20
  intermediary packages, silencing the YN0086 "does not provide zod"
  warnings without changing npm/pnpm resolution.

## 0.13.12 - 2026-07-21

The **reliability + audit-hygiene patch** (PR #242): remediation of the
thirteenth external deep retest - the first round completed end-to-end
against the published npm packages and live OpenAI, plus a defensive
security audit. It found no P0 and confirmed every 0.13.11 fix live;
this release addresses its remaining reliability and hygiene findings.
No breaking changes.

### Provider - single-flight cold parameter recovery (`@graphorin/provider`)

- While one call (the leader) climbs the HTTP-400 recovery ladder
  (`max_tokens` remap, `temperature` strip, tools `reasoning_effort`),
  concurrent siblings that hit their own recoverable 400 now wait for
  the leader and retry once from the fully learned state instead of
  climbing every remaining rung themselves. A cold five-way batch (the
  LLM-reranker shape) drops from 15 HTTP calls to 11, and only the
  leader ever sends doomed intermediate parameter shapes - less 400
  noise and less rate-limit pressure during the learning window. The
  0.13.11 correctness guarantee is unchanged: each call keeps its own
  per-call attempt ledger, so a waiter still recovers independently
  when the leader dies mid-ladder (429, network error). New
  deterministic tests cover the five-way chained batch, a
  tri-recovery interleaving (all three parameters learned
  concurrently), and the leader-death fallback.

### LLM reranker - actionable failure diagnostics (`@graphorin/reranker-llm`)

- `lastErrorCount` alone said "something degraded"; diagnosing a live
  incident meant re-running billed calls. After each `rerank(...)`,
  `lastFailures` now records per-passage detail - error class name,
  HTTP status when present, or the truncated off-format reply
  snippet - capped at 25 entries, and `lastOffFormatCount` counts
  unparseable replies separately from provider failures
  (`lastErrorCount` semantics unchanged). For live cloud usage,
  compose the provider with `withRetry` before handing it to
  `createLlmReranker`: the raw adapter deliberately retries nothing,
  so a cold `batchSize` burst can trip provider rate limits and
  degrade passages to the fallback score.

### Evals - judge off-format retry + typed classification (`@graphorin/evals`)

- Reasoning-model judges can burn a tight `maxOutputTokens` on hidden
  reasoning and return an EMPTY visible reply - observed live on the
  HaluMem QA smoke. `llmJudge` now re-asks once on a missing
  `SCORE: <n>` marker with a constrained marker-only instruction and a
  raised output budget (`offFormatRetries: 0` restores single-shot
  fail-loud). Exhausted retries throw the typed `JudgeOffFormatError`
  carrying a stable `judge-off-format:` marker, and the HaluMem
  runner reports such cases as `status=JUDGE_FAILED` (the subject's
  answer was never graded; the run still exits non-zero) with
  `benchConfig.judgeOffFormatCases`. A new `benchmark:compare` entry
  point renders two benchmark `--json` artifacts as one A/B markdown
  table, and a `diet` golden proves the update-omission harness passes
  with a well-behaved scripted provider and flags a lazy one.

### CLI - CI-safe pepper + bootstrap-aware doctor (`@graphorin/cli`, `@graphorin/security`)

- `graphorin init --pepper-out <path>` writes the server pepper hex to
  a `0600` file (never overwrites) instead of printing it, so
  non-interactive bootstrap logs stop retaining the key material; the
  next-steps hint walks the file-based `secrets set --from-stdin`
  path and tells the operator to delete the file afterwards.
- `graphorin doctor` on an uninitialized host (no `~/.graphorin`, no
  `--config`) reports the `audit-db` encryption check as `skip` with
  an init hint instead of a hard `fail` - nothing could have
  registered an audit binding before bootstrap. Configured or
  bootstrapped deployments keep the strict fail
  (`checkEncryption` gains the `bootstrapped` option).

### Repository hygiene (no package changes)

- CI gains a **blocking secret scan** (gitleaks, pinned by version and
  sha256) with a narrow `.gitleaks.toml` path allowlist covering only
  synthetic-fixture trees - runtime source is fully scanned.
- The Docker smoke workflow publishes an **SPDX SBOM** of the built
  image (syft, pinned) as a build artifact.
- The Kubernetes template and deployment guide carry a loud
  `trustProxy: true` caution (spoofable `X-Forwarded-*` unless a
  trusted ingress overwrites them).
- `pnpm smoke-examples --exclude <name>` officially skips named
  examples for non-security audits; unknown names fail loudly and
  every exclusion is printed.
- The docs dist-budget notes mark the Rollup "large chunk" warning as
  accepted - the enforced ceiling is the 1 MB `maxJsChunkBytes` gate.

## 0.13.11 - 2026-07-21

The **data-safety + wire-hygiene patch** (PR #240): remediation of the
twelfth external deep retest, which re-audited the released 0.13.10 -
it confirmed the modern-model recovery, the Docker sandbox contract,
the benchmark cost stamps, and the docs-domain fix live, and found one
P0 (a silent data-loss path in the online encrypted swap) plus three
P1s. No breaking changes.

### Encrypted storage - fail-closed swap (`@graphorin/store-sqlite-encrypted`)

- `encryptDatabase({ swap: true })` could silently lose a CONFIRMED
  write when the live holder ran a different SQLite build than the
  cipher peer (the server links plain `better-sqlite3`; the migration
  runs `better-sqlite3-multiple-ciphers`). POSIX fcntl locks never
  conflict inside one process, so the journal-mode liveness probe
  raised no error - the swap renamed the source out from under the
  writer, whose post-swap `COMMIT` succeeded into an orphaned WAL that
  matched neither the backup nor the encrypted replacement. The
  live-writer check is now layered and fail-closed: WAL sidecar
  presence refuses the swap first (also after an unclean shutdown,
  with a recovery hint in the error), the journal-mode probe accepts
  only an actual `delete` result, the check reruns immediately before
  the rename pair, and `-wal`/`-shm` sidecars move together with the
  backup so even a race-window commit stays recoverable next to the
  `.bak.<ts>` file. Verified cross-driver with both real native
  drivers.

### Server - broken JSON never executes (`@graphorin/server`)

- A syntactically broken body (a truncated `{"input":`) was swallowed
  into `{}` by every route's parse helper, satisfied the
  `.default({})` schemas, and actually executed agents (200),
  streaming runs (202), and workflows (202). All 21 body-parse sites
  (nine route files plus `triggers/prune`) now answer
  `400 { "error": "invalid-json" }` before any side effect; a
  genuinely empty body keeps its documented bodiless-POST meaning.
  The idempotency middleware rejects broken JSON before fingerprinting
  or key reservation, so a corrected retry under the same
  `Idempotency-Key` executes instead of colliding with a stored 400.

### Provider - concurrency-safe parameter recovery (`@graphorin/provider`)

- The 0.13.10 unsupported-parameter recovery judged the LIVE shared
  learned state, so in a cold concurrent batch (the LLM reranker
  fires `batchSize` parallel requests) only the first sibling to
  process its HTTP 400 retried - every other one forfeited its retry
  and surfaced the error (observed live as a silent fallback score).
  Each attempt now records what it actually sent and recovers from
  that snapshot, bounded per call; the instance still learns and
  WARNs exactly once, and retries pick up sibling learning.

### Benchmarks - Unicode-safe abstention scoring

- A correct refusal written with a typographic apostrophe
  (`I don't have...` with U+2019) failed the deterministic LongMemEval
  abstention regex while the LLM judge scored it 10/10 - the live
  full-context report published 2/3 where the sample was 3/3. Scorer
  input is now normalized (curly quotes, modifier apostrophe,
  no-break space) before matching.

### Operations and supply chain

- `graphorin doctor --strict-smoke-local` (implies `--smoke-local`):
  CI-grade semantics - every `smoke:*` check must be `ok` or the exit
  code is non-zero; the scheduled real-integration workflow runs it
  live, with `OLLAMA_VERSION` pinned, a one-retry warm-up step, and
  daemon diagnostics uploaded on failure.
- The published-consumer audit now PROVES documented mitigations: an
  allowlist entry may declare the consumer package plus the npm
  override, and the job fails if the documented one-liner stops
  removing the advisory from the live registry graph.
- `better-sqlite3` peer widened to `^12.9.0 || ^13.0.0` (validated
  against 13.0.1; the workspace default stays 12.x while upstream
  13.0.x ships without `prebuild-install`); `dockerode` peer widened
  to `^4.0.0 || ^5.0.0` and tested on 5.0.1, which drops the `uuid`
  advisory chain for consumers.
- Package pages tell the whole story: the transformers.js pair's
  READMEs carry the known `adm-zip` advisory and verified override;
  the SQLite store READMEs document the pnpm 10 build-approval step.
- The observability span-budget canary asserts the median and skips
  the strict bound under any turbo-parallel run (`TURBO_HASH`), and
  `mvp-readiness` failure reports extract the first failing turbo
  task's own output block.

## 0.13.10 - 2026-07-21

The **modern-model compatibility + sandbox-contract patch** (PR #237):
remediation of the eleventh external deep retest, which re-audited the
released 0.13.9 - it confirmed the pricing aliases, the fail-closed
cost cap, the published-peer audit, and the 1Password argv fix live,
and found two P1s: current OpenAI reasoning models rejected every
Graphorin path that pins `temperature: 0`, and `DockerSandbox` typed
but did not execute part of the stable per-call contract. No breaking
changes.

### Provider - unsupported-parameter recovery (`@graphorin/provider`)

- Current OpenAI reasoning models (GPT-5 family, o-series) reject any
  non-default `temperature` with HTTP 400, and reject function tools
  on chat completions unless `reasoning_effort` is explicitly
  `'none'` - a server-side model default; the adapter never sent the
  field. Every memory phase, the reconciler, the LLM judge, and the
  LLM reranker pin `temperature: 0`, so those paths hard-failed. The
  OpenAI-shaped adapters now follow the `tokenLimitParam`
  learned-remap precedent: on the specific 400 the request is re-sent
  once (without `temperature`, or with `reasoning_effort: 'none'`
  scoped to tool-carrying requests), the instance keeps the switch,
  and one WARN is logged. Nothing is substituted for `temperature` -
  the determinism intent cannot be honored, so the field is omitted.
- New `unsupportedParamRecovery: 'auto' | 'off'` option (default
  `'auto'`); an explicit `providerOptions` value for either field
  disables that field's recovery so overrides keep failing loudly. No
  model tables are involved - the behavior stays provider-agnostic
  across the OpenAI-compatible ecosystem.

### Security - `DockerSandbox` executes the full per-call contract (`@graphorin/security`)

- The `SandboxRunOptions.env` allowlist is forwarded as the container
  `Env` (previously silently dropped; the image baseline such as
  `PATH` remains and is documented), per-call `maxMemoryMb` overrides
  the constructor-level limit, and `signal` now aborts the run: an
  abort force-removes the container and resolves `kind: 'aborted'`,
  including aborts that race container start.
- Failure diagnostics are no longer discarded: the log stream is
  demultiplexed into separate stdout/stderr channels, a non-zero exit
  surfaces the wrapper's stderr first line in the error message and
  both streams in the cause, and the `__INPUT__` source-input binding
  is documented. Verified against a live daemon (env visibility,
  stderr round-trip, mid-run abort).

### Benchmarks - honest `costPricingMatched` (private packages)

- Under `--allow-unpriced-model`, a run failing before the first
  usage response stamped `costPricingMatched: true` for a model the
  preflight already knew it cannot price. Both runners now stamp the
  report, the RESULTS header, and the post-run WARN from the
  preflight/observed union.

### Docs - links live on `docs.graphorin.com` (`@graphorin/store-sqlite` + repo)

- The root README release teaser and the store-sqlite
  concurrency-matrix link put docs paths on the bare landing domain -
  a guaranteed live 404 the offline lychee gate could not see. Both
  links fixed; a new `check-doc-links` CI gate bans docs paths on the
  bare domain across all tracked markdown (it promptly caught its own
  changeset quoting the retired URL).
- `mvp-readiness` now captures both output streams of a failed gate
  and prints a 16 KB tail next to the summary verdict (and a
  `failure` object in `--json`), so first-failure causes survive
  parallel turbo noise.

## 0.13.9 - 2026-07-21

The **pricing-honesty + supply-chain-audit patch** (PR #235):
remediation of the tenth external deep retest, which re-audited the
released 0.13.8 - it confirmed all four 0.13.7 fixes live on the
published packages (real `op` CLI, real OpenAI API, the memory-scorer
A/B measuring as designed) and found a P1 pricing-alias gap that
partially defeated `--max-cost-usd`, plus a high `npm audit` advisory
visible only in the PUBLISHED dependency graph. No breaking changes.

### Pricing - official aliases, both date formats, `-latest` (`@graphorin/pricing`)

- `priceLookupByModel({ modelId: 'gpt-4o-mini' })` returned `null`:
  the bundled snapshot retained only dated legacy rows, and the lookup
  only stripped compact date suffixes. The snapshot now carries
  explicit alias rows for `gpt-4o`, `gpt-4o-mini`, `o1`, and `o3-mini`
  at their verified routing targets' rates (official per-model pages,
  2026-07-20), plus input-billed `text-embedding-3-small` /
  `text-embedding-3-large` entries. There is deliberately NO blind
  undated-to-dated reverse strip - an alias may route to any
  snapshot - and an alias/dated price-equality invariant is pinned by
  test.
- The date-suffix fallback now recognises the dashed OpenAI form
  (`gpt-4.1-mini-2025-04-14`) alongside compact Anthropic dates, and
  `<family>-latest` resolves to the family's dateless entry (or its
  single retained dated snapshot; two candidates stay `null` rather
  than guessing which one "latest" bills as).

### Benchmark harnesses - the cost cap fails closed

- With `--max-cost-usd` set, the HaluMem and LongMemEval runners now
  resolve pricing for the subject AND judge before the first request
  and abort when any model is unpriced (the agent-level
  `RunBudget.onUnpriced: 'fail'` precedent) - previously an unpriced
  model contributed $0 to the shared accumulator, silently making the
  cap porous. The new `--allow-unpriced-model` flag accepts
  under-counted spend explicitly and is stamped into `benchConfig`.

### Supply chain - auditing what consumers actually install

- New `published-peer-audit` job (consumer-smoke workflow, weekly +
  on demand): a fresh isolated `npm install` of every published
  package, with `npm audit --omit=dev` high/critical findings gated
  against the reviewed allowlist in
  `.github/published-peer-audit-allowlist.json`. Unlisted advisories
  fail the job, and so does an allowlisted advisory that stops
  appearing, so accepted advisories and their documented mitigations
  cannot go stale. Rationale: the workspace lockfile applies pnpm
  overrides that npm consumers never inherit, so workspace-side
  scanners are structurally blind to the published graph.
- The known `adm-zip` advisory under the transformers.js
  embedder/reranker chains is documented in the security guide's new
  "Published dependency-graph advisories" section together with the
  VERIFIED one-line consumer override (`adm-zip ^0.6.0`); the exposure
  itself is install-script-only.

## 0.13.8 - 2026-07-20

The **1Password + eval-honesty patch** (PR #233): remediation of the
ninth external deep retest, which re-audited the released 0.13.7 - it
confirmed all four 0.13.6 adapter fixes live against the real OpenAI
API, measured the conflict pipeline's first real A/B gain (update
score 0.50 to 0.75), ran Docker, llama.cpp, Ollama, and macOS Keychain
end-to-end - and found one P1 in the optional 1Password package plus
scorer and cost-report honesty gaps. No breaking changes.

### Secrets - the 1Password resolver works against the real CLI (`@graphorin/secret-1password`)

- `op read` has no `--reveal` flag (that flag belongs to
  `op item get`), so every resolve failed at the CLI's flag parser
  with `unknown flag: --reveal`. The wrapper now spawns
  `op read --no-color '<uri>'`; argv-shape tests pin the exact spawn
  arrays, and a real-binary integration leg
  (`GRAPHORIN_RUN_OP_INTEGRATION=1`, an isolated `OP_CONFIG_DIR`, a
  pinned checksum-verified op 2.35.0 in the weekly `integration-real`
  workflow) proves the flags parse without any 1Password account.
- The `No accounts configured for use with 1Password CLI.` state of
  op CLI 2.35+ is now classified `signed-out` with an actionable setup
  hint (desktop-app CLI integration, `op account add`,
  `OP_SERVICE_ACCOUNT_TOKEN`, or Connect) instead of `unknown` with a
  generic one.

### Evals - memory scorers stop punishing verbose-but-correct memories (`@graphorin/evals`)

- The operation-level scorers' default matcher is now token-set F1 OR
  directional gold-content coverage (function words stripped from the
  gold side, negations kept; tunable via the new `minGoldCoverage`
  option). Previously a semantically perfect memory (gold
  `User is pescatarian` vs the model's `The user started eating fish
  again ... identifies as pescatarian.`, token F1 0.235) was graded
  missed, hallucinated, and omitted at once, deflating extraction
  recall, extraction precision, and the update-omission A/B on small
  operation benchmarks. Expect those numbers to shift on existing
  reports; supply a custom `matcher` to keep the old symmetric-F1-only
  behaviour.
- New exports: `goldTokenCoverage`, `goldCoverageMatcher`,
  `defaultMemoryPointMatcher`.

### Bench harnesses - observed spend is reported, not just enforced

- The HaluMem and LongMemEval runners stamp
  `benchConfig.observedCostUsd`, `costPricingMatched`, and (when the
  pricing snapshot misses a model) `unpricedModels` into JSON reports,
  print the observed total in the run summary, and add an
  `Observed cost (USD)` line to the RESULTS header. The evals guide
  documents the honest cap semantics: already-observed spend is
  checked before each next request, so a run can overshoot the cap by
  at most one request's cost.
- `integration-real.yml` gains the `onepassword-cli` job described
  above and was dispatched green on this release's merge commit.

## 0.13.7 - 2026-07-20

The **OpenAI-compat adapter patch** (PR #230): remediation of the
eighth external deep retest, which re-audited the released 0.13.6,
confirmed the framework GO, and localized four P2 findings to the
generic OpenAI-compatible adapter and the real-eval harnesses. No
breaking changes.

### Provider - both base-URL conventions and current OpenAI models work (`@graphorin/provider`)

- A `baseUrl` that already ends in `/v1` (the `api.openai.com/v1` /
  LM Studio / vLLM convention - and the providers-guide example
  verbatim) now gets `/chat/completions` appended instead of producing
  a guaranteed-404 `/v1/v1/chat/completions`; a bare origin keeps the
  classic default, and an explicit `chatPath` always wins verbatim.
  Applies to `openAICompatibleAdapter` and `llamaCppServerAdapter`.
- New `tokenLimitParam` option (`'max_tokens' |
  'max_completion_tokens'`, exported type `TokenLimitParam`) pins the
  wire name for `maxTokens`. Left unset, the adapter reacts to the
  specific HTTP 400 naming `max_completion_tokens` by re-sending the
  request once with the remapped parameter and remembers the switch
  for the provider instance - current OpenAI models (GPT-5.6 family)
  now work through the generic adapter and the eval CLIs with no
  extra flags. Fields like `reasoning_effort` pass through per request
  via the existing `providerOptions` merge (now documented).

### Pricing and evals - shared real-eval helpers (`@graphorin/pricing`, `@graphorin/evals`)

- New `priceLookupByModel` (+ `ModelPriceRates`) in
  `@graphorin/pricing`: vendor-agnostic, model-id-keyed per-Mtok
  lookup over the bundled snapshot with the dateless-alias fallback,
  drop-in for `withCostTracking({ priceLookup })`. Extracted from the
  LongMemEval runner so every harness enforces `--max-cost-usd` with
  the same lookup.
- New `createFakeEmbedder` in `@graphorin/evals`: the deterministic
  offline bag-of-words embedder moved out of the LongMemEval runner so
  any harness can arm the vector leg without a model download.

### Bench harness honesty (not npm-published)

- The HaluMem runner no longer masks provider failures as quality
  zeros: consolidator outcomes are checked per session, ingest
  failures print `status=INFRASTRUCTURE_FAILED` with a non-zero exit,
  and the JSON report carries `infrastructureFailedCases`.
- HaluMem `--max-cost-usd` now actually enforces the cap (usage priced
  via the shared snapshot lookup), and the new `--embedder none|fake`
  axis arms the embedding three-zone reconcile route - without a
  vector signal the conflict on/off legs structurally converge, which
  the evals guide now states plainly.

## 0.13.6 - 2026-07-20

The **signed-leaf redaction patch** (PRs #227, #228): remediation of
the seventh external deep retest, which re-audited the released 0.13.5
and found no P0/P1. No breaking changes.

### Redaction - signed numeric JSON leaves stay grammar-safe (`@graphorin/provider`, `@graphorin/observability`, `@graphorin/security`)

- Masking a negative numeric leaf (`{"card":-4111111111111111}`) left
  a stranded minus before an unquoted mask, breaking `JSON.parse` in
  all three layers. The new span-based helper `jsonSafeSpan` (exported
  from `@graphorin/observability/redaction/patterns`, local twin in the
  security guardrail) absorbs the leading sign when the neighbour left
  of it is a JSON value delimiter and emits the quoted mask
  (`{"card":"[REDACTED creditcard]"}`); a prose minus stays untouched.
- `jsonSafeMask` keeps its exact historical behaviour for span-fixed
  callers, and both docblocks now state the whole-text ambiguity: a
  text consisting solely of the match is indistinguishable from a
  single-value JSON document and gets the quoted form (safe in both
  readings).
- The security `credit-card` pattern is digit-anchored on both ends,
  so the match no longer swallows the separator after the PAN (the
  `[REDACTED:credit-card]` marker used to glue onto the following
  word).
- Shared regression corpora plus seeded JSON-preservation property
  tests now run in all three suites: any valid JSON document stays
  valid after redaction.

### Infrastructure (not npm-published)

- The docs dist gate budgets the largest JS chunk (1 MB) so the local
  search index growing with the API surface, or a dependency landing
  eagerly in the app bundle, fails CI instead of shipping silently.
- New weekly `integration-real` workflow (never PR-blocking): a live
  Docker daemon runs the real sandbox one-shot container leg, and a
  live Ollama daemon (qwen3:0.6b + nomic-embed-text) runs every
  `doctor --smoke-local` leg end to end, with assertions that the real
  paths executed rather than degrading to skip. llama.cpp, OS keyring,
  and 1Password legs are documented as intentionally uncovered.

---

## 0.13.5 - 2026-07-20

The **compose-and-completeness patch** (PRs #224, #225): the reviewer
backlog batch - the standalone daemon can now serve the full domain
surface, every type referenced by a public API became importable, and
the docs artifact lost 87% of its weight. No breaking changes.

### Standalone server - config-driven compose (`@graphorin/server`, `@graphorin/cli`)

- A new `app` config field points at a compose module: `graphorin
  start` imports it, calls the default-exported factory (typed as
  `GraphorinAppFactory`, with `GraphorinAppContext` and
  `GraphorinAppBag` alongside in `@graphorin/server`) and spreads the
  returned adapter bag into `createServer(...)` - sessions, memory,
  agents, and workflows mount instead of 404-ing on a bare
  infrastructure daemon. The bag's optional `close` hook runs after
  `server.stop()` on shutdown and on failed boots.
- `graphorin init --app` scaffolds a working `graphorin.app.mjs`
  (SQLite store + memory + sessions REST adapters over the configured
  storage) and wires the config field; the scaffold is boot-tested in
  CI (a session is created and listed through REST).
- The standalone-server guide gains the compose section and a
  mounted-surfaces table (bare start vs app module vs programmatic
  embedding).

### API reference completeness (17 packages)

- About 130 types referenced by public APIs but unreachable from any
  documented barrel are now exported: memory tool input/output shapes,
  executor and truncation hooks, audit listener signatures, protocol
  frame zod schemas, sandbox peer-module structural views, the core
  agent-event variants, sqlite store row types, and more. All 115
  TypeDoc referenced-but-not-included warnings are cleared and the new
  warning budget ratchets at zero.
- Four never-importable file-local names gained descriptive names
  while becoming public: `ToolAuditListener`,
  `MemoryGuardAuditListener`, `SecretValueAuditListener`, and
  `ToolSearchToolMatch` (the registry-level `ToolSearchMatch` is
  unchanged). No previously importable name changed.

### Infrastructure (not npm-published)

- Docs dist 1.1 GB -> 150 MB: the full TypeDoc symbol sidebar is no
  longer server-rendered into every API page - each page now carries
  the 29 package links plus only the current package's modules. New CI
  budgets pin the total dist, per-page HTML sizes, and the largest
  asset.
- Core branch coverage 62% -> 84% via direct unit suites for the
  durable-workflow primitives, the ToolReturn envelope, and usage
  flattening; core coverage thresholds ratcheted to 90/90/80/90.

---

## 0.13.4 - 2026-07-20

The **grammar-safe redaction patch** (PR #220): remediation of the
sixth external deep retest, which re-audited the released 0.13.3 and
found no P0/P1. No breaking changes.

### Redaction - masking a numeric JSON leaf keeps the document parseable (`@graphorin/provider`, `@graphorin/observability`, `@graphorin/security`)

- When a redaction match sits in a bare JSON value position (its
  nearest non-whitespace neighbours are `:` / `,` / `[` on the left
  and `,` / `}` / `]` on the right), the mask is now emitted in double
  quotes, so masking a raw numeric leaf keeps the document valid:
  `{"card":4111111111111111}` becomes
  `{"card":"[REDACTED creditcard]"}` instead of the previous unquoted
  mask that broke `JSON.parse`. Applied consistently across the
  `withRedaction` provider middleware, the OTLP `RedactionValidator`,
  and the security `piiDetection` guardrail. Prose and string-leaf
  masking are unchanged, and the text is never parsed, so numeric
  lexemes outside the match keep their exact source form.
- The helper is exported as `jsonSafeMask` from
  `@graphorin/observability/redaction/patterns` for custom catalogues.

### Pricing - provenance carries the upstream authorities (`@graphorin/pricing`)

- `PricingSnapshot` and `LookupPriceResult` gained an optional
  `upstreamSources` list naming the original pricing pages the numbers
  were transcribed from, alongside the existing `source` artifact
  link. The bundled snapshot declares the Anthropic and OpenAI pricing
  pages; `refreshPricing(...)` declares its fetch URL. An external
  audit can now follow artifact then upstream without guessing.

### Documentation and infrastructure (not npm-published)

- The providers guide now separates request redaction (rewrites the
  outbound request) from response detection (emits violations but does
  not mutate the stream), with a canonical output-guardrail
  composition recipe.
- Perf-latency canaries in `@graphorin/security` and
  `@graphorin/sessions` skip under any coverage instrumentation (the
  CI coverage leg and a plain `vitest --coverage` run alike), so an
  instrumented microbenchmark no longer flakes.
- New TypeDoc warning ratchet: the docs build fails if the conversion
  warning count exceeds the committed budget, so the reference can
  only get more complete over time.

---

## 0.13.3 - 2026-07-20

The **numeric-integrity patch** (PR #215): remediation of the fifth
external deep retest, which re-audited the released 0.13.2 and found
one new defect. No breaking changes.

### Redaction - serialized numbers survive intact (`@graphorin/provider`, `@graphorin/observability`, `@graphorin/security`)

- The `withRedaction` provider middleware now honours per-pattern
  `verify` predicates in both the request scrub and the streaming
  response scan. Previously only the OTLP validator applied them, so
  the middleware masked ANY 13-19 digit run as
  `[REDACTED creditcard]` - a `fact_search` score like
  `0.01639344262295082` or an epoch-ms timestamp inside a JSON tool
  result came back corrupted, breaking the JSON the model reads. A
  rejected look-alike now stays byte-identical, emits no violation,
  and does not trip fail-closed mode.
- The built-in `creditcard` pattern refuses decimal-adjacent digit
  runs (a fractional part or the integer part of a decimal is never a
  card) and its verifier requires a major-network leading digit (2-6)
  on top of the Luhn checksum, so Luhn-lucky snowflake ids and
  timestamps are left alone. Exotic 1/7/8/9-prefix networks (UATP,
  petroleum, RuPay `81`/`82`, Troy) are documented as out of the
  built-in catalogue - register a custom pattern to cover them.
- The security guardrail's `credit-card` and `us-phone` patterns
  gained the same boundary guards (`us-phone` previously matched any
  10 consecutive digits inside a longer run). Standalone phone
  numbers, `+1` forms, and real PANs are still detected; the exported
  `luhn` helper is unchanged.
- Regression coverage: the reviewer's exact repro, epoch/snowflake
  fixtures, a seeded 250-payload corpus round-trip, verify-contract
  conformance, and streaming-scan cases across all three layers.

---

## 0.13.2 - 2026-07-19

The **honest-status patch** (PR #213): remediation of the fourth
external deep retest, which re-audited the released 0.13.1. No
breaking changes.

### Agent runtime - truncated tool calls are failures, not successes (`@graphorin/agent`, `@graphorin/core`)

- A provider stream that finishes while a tool call is still streaming
  its argument JSON (typically `finishReason: 'length'` at the
  output-token ceiling) no longer completes the run with the call
  silently dropped. The run now fails with
  `error.code: 'incomplete-tool-call'`, so a never-executed side
  effect (a memory write, a message send) can never read as success.
- New terminal `tool.call.incomplete` event per cut call
  (`toolCallId`, `toolName`, `finishReason`, accumulated `argsPrefix`;
  additive `AgentEvent` variant, forwarded under the `'lifecycle'`
  sub-agent policy). No `tool.call.end` or `tool.execute.*` events
  follow for that call, and there is deliberately no automatic retry:
  a fallback provider would hit the same ceiling, and re-running a
  side-effecting step needs the caller's idempotency decision.
- The truncated call's token usage is still recorded on the failed
  state, and a `'length'` finish with no pending tool call still
  completes (the text is simply truncated) - observable via the new
  optional `RunStep.finishReason` field.
- `prepareStep`'s `maxTokens` docblock and the agent-runtime guide now
  spell out the output-ceiling contract (256 tokens is a safe floor
  for small schema-driven tools).

### CLI - copy/paste-safe `init` hints (`@graphorin/cli`)

- `graphorin init` next-step hints (`graphorin migrate --config ...` /
  `graphorin start --config ...`) shell-quote the config path, so
  pasting them literally works from directories with spaces or
  apostrophes instead of failing at the truncated path. Quoting is per
  platform family: POSIX single quotes with the `'\''` idiom; Windows
  double quotes under the MSVCRT argv rules (backslash runs double
  before a quote or the end), implemented as a linear scan. Ordinary
  paths pass through untouched.

### Infrastructure (not npm-published)

- Docs-build purity gate: `pnpm docs:build` must leave the tree clean.
  The root-synced changelog page missed the 0.13.1 section at release
  time; the sync is committed, the generator's final newline is
  byte-stable, the sync runs inside `pnpm run version`, and docs CI
  fails on any committed file a build changes.
- The HaluMem CI stub summary leads with `status=UNSCORED` so an
  infrastructure smoke can no longer read as a memory-quality result.

---

## 0.13.1 - 2026-07-19

The **honest-docs patch** (PR #209): remediation of the third external
deep retest, which re-audited 0.13.0. No breaking changes.

### Pricing - GPT-5.6 cache-write premium + alias (`@graphorin/pricing`)

- The three GPT-5.6 snapshot entries now carry `cacheWriteUsdPerToken`
  (the official 1.25x-input premium: $1.25 / $3.125 / $6.25 per 1M
  tokens for luna / terra / sol). Cache-write tokens were previously
  billed at the cheaper input rate, under-counting that leg by 20%;
  estimates for cache-heavy GPT-5.6 workloads rise to the true cost,
  pinned to the official four-leg formula by a fixture test.
- Bare `gpt-5.6` resolves as a snapshot entry priced at sol rates (the
  OpenAI API routes the alias to `gpt-5.6-sol`) instead of
  `lookupPrice` returning `null` and the CLI exiting non-zero.

### Documentation - ticket-free public docs (all packages)

- Roughly 1100 TSDoc sites across 28 packages, the guide pages, five
  package READMEs and two runtime strings no longer cite internal
  audit/work-item ids; the generated API reference went from 522 label
  hits to 0 across 3187 pages, and a new `check-api-wording` CI gate
  keeps it that way.
- The quickstart hello-world now performs everything it promises:
  stream, persist a fact, close the store, reopen cold, recall the
  fact - and a consumer smoke twin proves the same flow against the
  published packages with a real cross-process restart.
- The generated API reference is excluded from the client-side search
  index: the shipped index chunk drops from 6.8 MiB to 729 KiB, with a
  2 MiB budget gate.

### Infrastructure

- vitest 4.1.10 across the workspace: fixes v8 coverage collapsing in
  checkout paths that contain a space (18.87% vs 79.74% lines on
  identical code under vitest 3.2.x), with a CI step running one
  package's coverage from a spaced copy so the class stays pinned.

## 0.13.0 - 2026-07-19

The **fail-closed budget release** (PR #206): the response to the
2026-07-19 external deep retest - all four P1 and three P2 findings
closed, one of them with a deliberate breaking default.

### Agent - unpriced cost ceilings are fail-closed (`@graphorin/agent`)

- **BREAKING**: `RunBudget.maxCostUsd` with usage that carries no USD
  cost data no longer warns and spends unmetered. The new
  `RunBudget.onUnpriced` defaults to `'fail'`: the run stops at the
  first between-step check (`'stop'` shape fails the run with
  `error.code: 'budget-unpriced'`; `onExceed: 'throw'` rejects with the
  new `AgentBudgetUnpricedError`). A caller who set a cost cap must
  never keep spending unmetered. Opt back into the pre-0.13 warn-once
  behaviour with `onUnpriced: 'warn'`, or wire `withCostTracking` with
  a `@graphorin/pricing` snapshot so the ceiling observes real spend.

### Pricing - the current OpenAI line is priced (`@graphorin/pricing`)

- Added the GPT-5.6 family (`gpt-5.6-luna`, `gpt-5.6-terra`,
  `gpt-5.6-sol`) to the bundled snapshot at the official standard
  short-context rates; snapshot date is now 2026-07-19. The retest ran
  Graphorin live against these models and found `lookupPrice` returned
  null - which, combined with the old warn-only budget, meant
  `maxCostUsd` was silently unenforced for the current OpenAI line.

### CLI - onboarding honesty (`@graphorin/cli`, `@graphorin/security`)

- `graphorin init --cloud-consent` is actionable instead of
  decorative: the chosen tier is delivered as the exact
  `createMemory({ contextEngine: { privacy } })` snippet - printed as
  next-steps step 5 and embedded in the `.ts` config comment (memory
  is composed in code; the server config genuinely cannot enforce it).
- `graphorin doctor --all` with a config that disables the audit log
  reports the audit-encryption check as `skip` instead of a false
  `fail`; the internal "Phase 05" jargon left the hint.

### Also in the repository at this version

- **The spaced-path silent no-op class is dead**: 12 benchmark runners
  and 2 documentation gates used an entrypoint guard that compared a
  percent-encoded file URL to a raw path - in any checkout whose path
  contains a space they imported, ran nothing, and exited 0. All 14 now
  compare real paths, and the new `check-entry-guards` CI gate (static
  sweep + a dynamic spaced-directory proof in gates-selftest) keeps the
  idiom from coming back.
- TypeDoc knows the house `@stable` tag: API-reference warnings fell
  from 2721 to ~115 (0 errors), and the api-freshness gate is now
  environment-independent (source links normalized regardless of git
  context).
- The HaluMem offline stub summarizes `scored=not-scored
  (plumbing-only)` instead of a `passed=0` line that read like a failed
  quality gate.
- Transitive `adm-zip` pinned to `>=0.6.0` (GHSA-xcpc-8h2w-3j85).

## 0.12.1 - 2026-07-17

The **live-verification patch** (PRs #197-#205): the first billed
real-provider pass over the published packages, and the one defect it
found.

### Provider - schema-less structured requests send no `response_format`
(`@graphorin/provider`)

- The billed live pass against the Anthropic OpenAI-compat endpoint
  (the exact target the 0.10.2 LIVE-EVAL-01 fix named but was never run
  against live) showed the endpoint rejects EVERY permissive
  `response_format` spelling: `json_object`, `json_schema` with
  `strict: false`, and `strict: true` over an open schema. A
  schema-less `outputType: { kind: 'structured' }` request therefore
  sends **no `response_format` at all** - the agent's trailing JSON
  instruction plus the local `schema.parse` gate carry the contract.
  Explicit `outputType.jsonSchema` requests keep the strict
  `json_schema` mapping (live-verified green with a closed schema).
  Rule of thumb for the compat endpoint: keep explicit schemas CLOSED
  (`additionalProperties: false`, all properties required).

### Also in the repository at this version

Not part of any published package, but part of the release line:

- **Coverage thresholds enforced in CI**: a dedicated leg runs
  `--coverage` across all 29 packages (the declared thresholds used to
  be aspirational); security's p95 latency canaries skip under
  instrumentation, proactive's real functions gap was closed with
  tests, cli's branches threshold was ratcheted to its measured floor.
- **First real-provider LongMemEval baselines**: all five abilities
  seeded from the billed run (claude-haiku-4-5 subject, dedicated
  local qwen3 judge) - 338/500 (67.6%) overall - so the dispatch
  workflow's regression gates now compare against real numbers. Judges
  always resolve think-off, and `--max-cost-usd` now observes real
  spend through the bundled pricing snapshot.
- **`benchmarks/conformance`** (audit item 10): 13 deterministic
  framework-floor checks run in `benchmark:ci` with a versioned
  conformance report.
- **Two new examples**: `examples/assistant-bot` (the official
  whole-bot recipe - agent, memory recall, sessions, REST HITL resume,
  heartbeat, channels front door on one stub-driven stack) and
  `examples/structured-verifier` (audit item 9 - closed wire schema,
  zod parse gate, verifier continuation round).

## 0.12.0 - 2026-07-17

The **durable-approvals release** (PR #195): the top follow-ups from
the 2026-07-17 production-readiness review - a HITL park now outlives
the process that created it, and the server's network defaults close
the two soft spots the review flagged.

### Durable suspended agent runs - migration 038
(`@graphorin/agent`, `@graphorin/server`, `@graphorin/store-sqlite`)

- A run parked on durable HITL (`awaiting_approval`) **survives a
  server restart**: the `RunStateTracker` mirrors every park into the
  new `suspended_runs` sidecar (`store.suspendedRuns`), boot hydration
  re-registers persisted parks, and `POST /runs/:runId/resume`
  rehydrates them - the messenger's approve button keeps working after
  a redeploy.
- The `Agent` interface gains the codec behind it:
  `serializeState(state)` / `deserializeState(serialized)`
  (version-stamped `graphorin-run-state/x.y`, binary payloads through
  the wire projection, secret-named keys redacted at rest). Hand-rolled
  `Agent` implementations must add both methods; hand-rolled
  `ServerAgentLike` registry fixtures without them keep the previous
  in-memory behaviour and the resume endpoint answers an actionable
  `409 run-state-unavailable` (`500 run-state-invalid` for an
  unreadable durable payload).
- Rows drop when the run settles (resume completes or fails, or an
  explicit `POST /runs/:runId/abort`); the graceful-shutdown
  force-abort deliberately keeps them. `suspended_runs` is
  session-scoped, so the session hard-delete erasure cascade covers it.

### Server - secure network defaults (`@graphorin/server`)

- **BREAKING**: `metrics.requireAuth` now defaults to `true` -
  `GET /v1/metrics` requires the `admin:metrics:read` scope out of the
  box (the exposition leaks trigger ids and consolidator budgets).
  Give your Prometheus scrape job a bearer token or opt out explicitly
  with `metrics: { requireAuth: false }` for trusted networks.
- The server now states its TLS posture: it serves **plaintext HTTP
  only** (no in-process TLS by design). A non-loopback bind logs a
  startup WARN until the fronting reverse proxy is acknowledged with
  the new `server.tlsTerminatedUpstream: true` flag (records intent;
  changes no runtime behaviour).

### CLI - revocation propagation note (`@graphorin/cli`)

- `graphorin token revoke` / `token rotate` print the propagation
  window: the CLI writes the token store directly, so a running server
  may honor the old token for up to its verifier-cache TTL (default
  60s). Revoke via `DELETE /v1/tokens/:id` on the live server (evicts
  the cache synchronously) or restart it for immediate effect.

### Docs

- The README package table and architecture diagram catch up with the
  0.9.0 first publications: `@graphorin/channels` (Tier 3) and
  `@graphorin/proactive` (Tier 5) are listed, and the package count
  reads 29 everywhere.
- Deployment guide: a "TLS termination" section, the authenticated
  Prometheus scrape, and a `suspended_runs` row in the
  retention/growth table (self-clearing; deliberately no retention
  window - a park waits on a human).

## 0.11.0 - 2026-07-17

The **local-first first-run release** (PR #193): the remaining
engineering items from the 2026-07-16 external-audit plan, shipped as
one "will a local assistant run well on this machine?" story.

### CLI - `graphorin doctor --smoke-local` (`@graphorin/cli`)

- Six checks through the same code paths the framework uses at
  runtime: `smoke:native` (the `better-sqlite3` binding +
  `sqlite-vec`, with a pnpm-10 skipped-build install surfaced as the
  actionable `SqliteNativeBindingError` fix), `smoke:sqlite-roundtrip`
  (write / close / reopen / search, FTS-only - no models needed),
  `smoke:ollama` (daemon reachability; degrades to warn + skip),
  `smoke:ollama-models` (`--ollama-model` asserts presence),
  `smoke:embedding` (a real `/api/embed` probe reporting the
  dimension), and `smoke:chat` (a streamed tool-call round-trip
  through the real `ollamaAdapter`, `think: false`, reporting the
  server's load / prompt-eval / generation split).
- `--smoke-local` alone runs only the smoke; it composes with
  `--check-*` / `--all` and is deliberately not implied by `--all`.
- `@graphorin/cli` now depends on `@graphorin/provider`.

### Provider - Ollama server timings in events and traces
(`@graphorin/core`, `@graphorin/provider`)

- The `ProviderEvent` `finish` variant gains an optional
  `providerMetadata` field, mirroring
  `ProviderResponse.providerMetadata` for the streaming path.
- The Ollama adapter normalizes the server's nanosecond timing fields
  into the new `OllamaTimings` shape (`totalMs` / `loadMs` /
  `promptEvalMs` / `evalMs`) under `providerMetadata.ollama` on both
  the streamed `finish` event and `generate()` - a cold call dominated
  by model load no longer looks like slow generation.
- `withTracing` stamps numeric vendor diagnostics onto the provider
  span as `graphorin.provider.<vendor>.<key>` attributes (bounded,
  numbers only).
- `DEFAULT_OLLAMA_BASE_URL` is exported from the package barrel.

### Docs

- The providers guide gains a measured `qwen3:8b-q4_K_M` profile on
  Apple Silicon (M1 Max, 32 GB, Ollama 0.32.0): resident memory per
  `num_ctx`, cold vs warm load, the `num_ctx`-change re-load cost,
  generation speed, and the `think: true` wall-time impact - plus a
  practical settings block.
- The CLI guide documents the smoke with a real annotated run.

## 0.10.2 - 2026-07-17

The documentation-reconciliation tail of the 2026-07 end-to-end
campaign (PRs #188, #190, #191): small CLI contract fixes plus a sweep
that reconciled every remaining doc-drift item against the shipped
code.

- **CLI** (`@graphorin/cli`): `triggers prune` requires an explicit
  `--before` cutoff instead of silently no-opping (OPERATOR-01);
  `memory review --json` for scripted triage (MEMORY-CL-02);
  `secrets ref` threads `--secrets-source` / `--strict-secrets`
  (SECRETS-S-03/04); `guard --help` names all five tiers.
- **Provider** (`@graphorin/provider`): the OpenAI-compatible adapter
  sends structured output as `json_schema` (LIVE-EVAL-01).
- **Docs**: the agent-runtime filter table documents `bySensitivity` /
  `stripSensitiveOutputs` as the coarse `[REDACTED:...]`-token
  heuristics they are (AGENT-FIL-01/02/03); guide pages catch up with
  the MEMORY-C-03 behavior shipped in 0.10.1; the channels guide shows
  the real untrusted-content envelope attributes (`trust=` / `tool=` /
  `origin=`); the imperative-scan budget is documented as 250 ms, not
  5 ms (TOOLS-EX-02); the reconnect backoff and `ProtocolGuardConfig`
  docstrings match the implementation (ORPHAN-SU-02, LATERAL-L-03).

## 0.10.1 - 2026-07-16

The **e2e-remediation release**: closes the 2026-07 end-to-end
campaign over the released 0.9.0 / 0.10.0 line (PRs #184, #186, #187)
with 37 fixes - three criticals, the P1 batches, and the P2 tail.
Per-package details live in each package's `CHANGELOG.md`; observable
behavior changes are in the migration guide.

### Criticals

- **STORE-SQ-02**: session erasure crashed (and rolled back) in the
  default vec0 mode - the sidecar discovery scan matched vec0 SHADOW
  tables, whose DELETE rejection aborted the whole cascade. The
  GDPR-style erasure path works again, with a regression test on the
  real vec0 path.
- **MEMORY-C-01**: a working block written under a partial
  (NULL session/agent) scope could never be mutated a second time (the
  UNIQUE index treats NULLs as unequal); upserts now resolve rows
  NULL-safely.
- **WS-LIFECY-02**: graceful shutdown hung forever with a connected
  WebSocket client; `dispatcher.shutdown()` now closes sockets with
  the documented `4007` close code and `stop()` gains a drain-budget
  force-close.

### Agent, provider & cost

- **R-01**: `RunBudget.maxCostUsd` enforces - `withCostTracking`
  stamps the computed cost onto run usage (previously it only reached
  the `onUsage` hook, leaving the ceiling inert).
- **PROVIDER-CT-01**: tiktoken-backed counters no longer throw on
  special-token sequences such as `<|endoftext|>`.
- **PROVIDER-01**: cached reads bill at the input rate when the price
  entry has no cached-read rate (was billed at $0).
- **T3**: reasoning / local-adapter defect batch; **MODEL-FAL-01**:
  the gpt-4o family classifies correctly.
- **ORPHAN-SU-03**: concurrent OAuth `refresh()` calls share one
  rotation (one audit row / lifecycle event / rotation hook);
  **OAUTH-ADV-01/02**: DCR and device-authorization failures carry the
  RFC `error` / `error_description`.
- **LATERAL-L-01**: the default lateral-leak denial catalogue is no
  longer inert.

### Memory & sessions

- **MEMORY-C-02**: exact dedup works without an embedder (FTS
  fallback); **MEMORY-C-03**: the compaction default is gated on
  `providerContextWindow` - a bare `createMemory()` is off and silent
  instead of warning on every construction; **MEMORY-R-02**: a
  malformed fusion weight is coerced instead of crashing search;
  **BUFFER-N-01**: invalid consolidator trigger specs warn at
  construction.
- **SESSIONS-01**: session reads are scoped by `userId`.
- **SESSION-R-01/02/03**: session replay reproduces the run
  (routing-id sensitivity + internal minTier default), and a null
  cassette body throws a typed error.

### Server, workflow, security & tooling

- **TOKENS-RE-01**: `DELETE /v1/tokens/:id` invalidates the verifier
  LRU immediately (a warm token no longer authenticates for up to
  60 s); **SERVER-C-01**: workflow endpoints return the documented
  error envelope; **SERVER-CH-01**: a failed `start()` unwinds its
  daemons and `stop()` is a no-op afterwards; **SERVER-DO-01**:
  `/v1/health` surfaces the orphaned-trigger count.
- **WORKFLOW-01**: the timer driver re-arms at the earliest future
  wake; **TRIGGERS-01**: disabled triggers no longer fire via
  `emit()` / manual `fire()`.
- **SECRETS-S-01/S-02**: denied `ctx.secrets` access is audited, and
  `GRAPHORIN_MASTER_PASSPHRASE` activates the encrypted-file store
  from the CLI; **TOOL-AUDI-01**: the durable-HITL approval lifecycle
  is audited; **TOOL-AUDI-02**: audit export enforces mode 0600 on a
  pre-existing file; **TOOLS-EX-01/CHANNELS-01**: `bytesStripped` is
  never negative.
- **CORE-PRO-01**: RPC success frames require a `result` field;
  **OBS-PRIC-01**: `toOtlpEnvelope` is `@stable` and barrel-exported;
  **OBS-PRIC-02**: opt-in redaction patterns via `enabledPatterns`;
  **ORPHAN-SU-01**: OpenInference spans cover the insight tier and
  consolidate phases.
- **CLI**: the T8 batch (migrate strategy validation, offline revoke,
  read-only migrate guard); **CLI-01**: `token rotate` / `rekey` print
  the raw token to stdout (parity with `create`); **EVALS-REP-01**:
  the regression boundary is exclusive and float-robust.

## 0.10.0 - 2026-07-16

The **external-audit remediation release**: an independent consumer
audit of `0.9.0` (published packages + a repository clone, with both
an Anthropic and a local Ollama leg) confirmed the framework end to
end and pinned a P1 list on the local-model path and the
first-install experience. This release closes that list (PRs #181,
#182). Per-package details live in each package's `CHANGELOG.md`;
upgrade notes are in the migration guide.

### Provider - Ollama operational controls (`@graphorin/provider`)

- `ollamaAdapter` gains `think`
  (`false | true | 'low' | 'medium' | 'high'`, Ollama's top-level
  thinking field; a truthy value also defaults
  `capabilities.reasoning` to `true`), `numCtx` (sent as
  `options.num_ctx` on every request AND used as the default
  `capabilities.contextWindow`, so the server allocation, the declared
  capability and the memory compaction budget agree on one number),
  and `keepAlive` (Ollama's `keep_alive`).
- Streamed `message.thinking` chunks surface as `reasoning-delta`
  provider events (agent `reasoning.delta`) instead of being dropped.
- Honest `toolChoice`: `'none'` is enforced by withholding the tool
  catalogue, `'auto'` passes through, and a forced choice
  (`'required'` / `{ tool }`) throws the new
  `ProviderToolChoiceUnsupportedError` instead of silently degrading
  the contract to a suggestion - the native `/api/chat` API has no
  `tool_choice` field; the OpenAI-compatible adapter against
  `http://127.0.0.1:11434/v1` maps it.
- `providerOptions` with a nested `options` object merges into the
  built options block instead of clobbering `temperature` /
  `num_predict` / `num_ctx`.

### Store - actionable native-binding failure (`@graphorin/store-sqlite`)

- pnpm 10+ skips dependency build scripts unless approved, so a
  consumer install could look successful while `better-sqlite3`'s
  prebuilt binary was never downloaded - the first database open then
  died with a raw `bindings.js` stack. Both driver loaders (default
  and the cipher peer) now throw the typed `SqliteNativeBindingError`
  naming the exact fix (`pnpm.onlyBuiltDependencies` + reinstall); the
  cipher path previously misreported this case as a missing peer.

### Documentation & release tooling

- Installation guide: new "Native modules and pnpm 10" section with
  the `onlyBuiltDependencies` recipe; the quickstart starts
  warning-free and its real-local-LLM recipe shows the coherent
  context profile (`numCtx` + `providerContextWindow` +
  `JsTiktokenCounter`).
- Providers guide documents the new Ollama controls, the context-sync
  rationale, and the forced-`toolChoice` limitation with its
  workaround.
- New weekly consumer-install smoke replays the documented pnpm-10
  recipe against the published packages
  (`scripts/smoke-consumer.mjs`); the docs deploy gained a
  post-deploy version smoke; the security audit job moved from the
  retired npm classic audit endpoint to a pinned `osv-scanner`; every
  changesets-ignored workspace package now carries a seed
  `CHANGELOG.md` so the release automation cannot crash on a missing
  file.

## 0.9.0 - 2026-07-13

The **bot-adoption release**: five feature waves (PRs #170, #171,
#172, #176, #177) that turn the framework into a complete substrate
for a long-living personal assistant developed in a separate
repository - a channel front door, proactivity, a provable memory
quality loop, fine-grained permissions, and the workflow durability
tail. Two packages publish for the first time:
`@graphorin/channels` and `@graphorin/proactive`. Per-package details
live in each package's `CHANGELOG.md`; upgrade notes are in the
migration guide.

### Channels front door (new package `@graphorin/channels`)

- Vendor-neutral adapter SPI (`ChannelAdapter`, identity triple
  routing, capability flags), deterministic access policies
  (`pairing | allowlist | open | disabled`) with a persisted pairing
  store (migration 034), and a conformance testkit
  (`@graphorin/channels/testkit`) with an in-memory loopback adapter -
  a messenger adapter is written against the testkit, no vendor code
  ships in the framework.
- Inbound trust boundary: channel text enters through sanitization +
  a new `channel-inbound` trust class, seeds the run's taint ledger
  (`InboundTaintSeed`), and message-borne untrusted input arms the
  same data-flow policy tools do. Outbound `deliver()` cleans agent
  scaffolding through the shared commentary catalogue on every
  channel.
- Gateway daemons compose into the server lifecycle by structural
  typing (bounded inbound queues, health aggregation, activity
  signals); `SttAdapter` seam for voice transcripts (provenance
  `channel-inbound`).

### Proactivity (new package `@graphorin/proactive`)

- `createHeartbeat(...)`: checklist-driven quiet-hours-aware heartbeat
  on a cheap isolated profile; skips on empty checklists, defers while
  another run is active (`Agent.isBusy()`), strips sentinel replies.
- Durable cron leg: fresh session per fire with fail-closed model
  pinning (`pinnedProvider`) and a deterministic no-recursive-
  scheduling posture; composes with the workflow timer daemon.
- Escalation ladder `notify | question | review | act`: questions and
  reviews ride durable HITL (agent approvals or workflow awakeables,
  addressable through awakeable refs); `act` requires an explicit
  per-task grant AND a configured memory ingest gate - refused
  fail-closed otherwise. The server resume endpoint for agent HITL is
  real (the honest 501 retired).
- Scheduler guardrails (interval floor, per-task jitter, task limit,
  auto-expiry) and a run-level budget
  (`budget: { maxCostUsd, onExceed }`) enforced between steps.
- `scaffold: 'minimal'` agent preset: instructions-only prompt,
  defer-everything tool catalogue behind `tool_search`, no plan tool -
  the cheap posture for proactive fires.

### Memory quality loop

- Operation-level eval metrics: a HaluMem-format dataset loader,
  deterministic extraction recall/precision and update-omission
  scorers, a judged QA-hallucination scorer, and the
  `benchmarks/halumem` harness that replays cases through the REAL
  ingest path with a `--conflict-pipeline on|off` A/B - the
  reconcile path's value is now measurable, not asserted.
- Profile projection: the consolidator materializes a read-only,
  user-scoped `profile` working block from ACTIVE facts only (never
  quarantined or contested values), with fact-id provenance and an
  explicit erasure path (`WorkingMemory.purge`).
- Tool profiles `interactive | reviser | full` (interactive never
  constructs write tools), generalized curated-block passes
  (`consolidator.curatedBlocks`), and a `reviserConsolidatorPreset`
  for a cheap sleep-time revision agent.
- Closed promotion loop behind fail-closed gates: a pre-compaction
  `memoryFlushHook` salvages durable facts (quarantined, through the
  ingest gate), a persistent recall ledger (migration 036) counts
  distinct queries per fact, and the deterministic `PromotionPolicy`
  promotes only multi-signal evidence through the audited validate
  path. Enabling promotion or `autoPromoteExtraction` without an
  `ingestGate` now throws (`IngestGateRequiredError`). Opt-in
  `procedureInduction.auto` distils completed runs into quarantined
  procedures.
- Index hygiene: the embedder migration is resumable across processes
  (`graphorin memory migrate` is a real command: `--embedders`,
  `--batch-size`, `--reclaim`, `--json`), sqlite-vec absence can
  degrade to a linear-fallback KNN instead of failing, retired vector
  tables reclaim their space, and the chunking mode participates in
  the index version key.

### Permissions (four-value permissionDecision)

- Tool policy vocabulary widens to `allow | deny | ask | defer`
  (priority `deny > defer > ask > allow`; `'forbid'` stays as the
  alias of `'deny'`). `ask`/`defer` suspend the run durably exactly
  like `needsApproval` (`ToolApproval.mode`); `deny` blocks
  deterministically.
- Pre-tool `permissionHook`: one caller decision point over every
  executor-bound call, with schema-revalidated `updatedInput`
  rewrites that are what the approval record, policy and data-flow
  gates all see; rewrites of already-granted args are refused on
  resume replays.
- Deny-by-name removes a tool everywhere at once: the advertised
  catalogue, `tool_search` discovery/promotion, and execution
  (including inline handoff/sub-agent calls).
- Deferred decisions park as workflow approvals with a durable
  deadline (`requestApproval(name, payload, { timeoutAt })`); an
  unattended deadline auto-denies.

### Workflow durability tail

- `fork(threadId, checkpointId, { patch })` branches a thread with
  corrected channel values (JSON-safety re-checked); the fork route
  accepts the patch as `state`.
- Read-only thread inspection without the node graph
  (`readThreadState` / `listThreadCheckpoints`) and the operator CLI
  `graphorin workflow inspect|checkpoints`.
- The cross-process durability invariant is pinned end-to-end: a
  thread suspended on an approval in a SIGKILLed process resumes from
  SQLite in a fresh one.
- Code-mode runtime is a named seam (`CodeModeRunner` +
  `AgentConfig.codeMode { run, limits }`): substitute where
  model-written scripts execute; credentials, `RunState` and policy
  never cross the boundary.

### Foundations (wave A)

- Triggers: orphaned persisted triggers WARN + emit a typed event,
  register-time catch-up waits for `start()`, prune detects true
  orphans, and cron declarations accept an IANA `timezone` with a
  pinned DST policy.
- Consolidation: new `buffer:N` trigger ("consolidate once N tokens of
  unprocessed transcript accumulate") plus server-side activity
  signals that make `idle:T` a real debounce.
- Workflow deploy tail: `awaitExternal(name, { schema })` validates
  resolved payloads at delivery (invalid payload restores the
  suspension), awakeable addresses serialize for messenger callback
  data, and the server warns loudly when workflows are registered
  without a timer driver.

## 0.8.0 - 2026-07-11

The first **behavioral audit release**. A full end-to-end campaign ran
the framework the way consumers do - 33 scenarios across five tiers
(deterministic stub, live Ollama models, billed Anthropic API, Docker,
real network) - and adversarially confirmed 30 defects with file-level
root causes. This release fixes all of them; every fix carries a
regression test, and an independent re-validation pass re-ran every
original reproduction against the fixed tree (24/24 resolved, zero
regressions). Per-package details live in each package's
`CHANGELOG.md`; upgrade notes are in the migration guide.

### Memory (critical)

- **The conflict pipeline no longer destroys distinct facts under real
  embedders**: storage adapters return vector scores normalized to
  `(1 + cos) / 2`, but the three-zone thresholds stayed calibrated for
  raw cosine, so the NEAR-DUP zone fired at raw cosine `0.70` and
  nearly every distinct e5-family sentence pair silently deduped into
  the first written fact. Stage 2 (and Stage 5's reported
  `similarity`, hence `fact_conflicts.similarity`) now map store
  scores back to raw cosine at the pipeline boundary; regression tests
  run against the real sqlite-vec adapter, and the in-memory test
  fixture now models the production score contract so this class of
  drift cannot ship silently again.

### Server & client

- WebSocket subscribe replies now reach the wire **before** replayed
  frames, and the client buffers frames that arrive for a
  not-yet-mapped subscription - replayed events are no longer silently
  dropped on fresh subscribes and reconnect resumes.
- `/v1/metrics` mounts behind the auth boundary, so
  `metrics.requireAuth: true` works with `admin:metrics:read` (it was
  a permanent 401); `GET /v1/workflows/:id/state` answers 404
  `thread-not-found` for unknown/deleted threads instead of a plain
  500; `stop()` no longer closes caller-injected stores; `/v1/health`
  clamps `walSizeBytes` to 0 off WAL mode.
- The client's workflow subscription target gains an optional `runId`
  to subscribe to the run-scoped subjects the execute/resume routes
  advertise - previously workflow run events were unreachable through
  `GraphorinClient`.

### Local model stack

- `@graphorin/reranker-transformersjs` works out of the box: the
  default dtype is device-aware (`q8` on CPU - the fp16 ONNX exports
  fail session init there) and real scoring reads raw model logits
  (sigmoid / positive-label softmax) instead of the
  text-classification pipeline, whose softmax collapsed single-logit
  BGE rerankers to a constant `1.0` (reranking was a no-op). A
  network-gated regression test pins the real default model.

### CLI

- `tools lint` honours its exit-2 contract (broken `--config` no
  longer silently passes with the default glob) and its globstar
  matches zero directories; `triggers status/fire/disable/prune` run
  with migrationPolicy `check` and refuse to auto-migrate a
  behind-schema database (W-068); `skills migrate-frontmatter` dry-run
  lists what `--apply` would rewrite; `storage status` probes the
  cipher peer through the encrypted sub-pack (agreeing with what
  `encrypt`/`rekey` can do); `storage backup` mirrors the source file
  mode; `doctor` gains `--config <path>`; `init` gains
  `--format ts|json`; `audit verify` honours `--json` on the error
  path. **Behavior change**: `token create` prints the raw token to
  stdout (log chatter stays on stderr), so
  `TOKEN=$(graphorin token create ...)` works.

### Security & integrations

- The worker-threads sandbox settles (`execution-failed`) when a
  worker exits 0 without producing a result, instead of hanging the
  run; the Docker sandbox demuxes multiplexed container logs (the
  live path failed every run).
- The 1Password resolver classifies the op CLI v2 signed-out message;
  the `@graphorin/mcp` OAuth helpers accept and forward
  `secretsStore` (refresh/revoke can actually succeed across
  processes), and the authorization provider no longer burns a
  refresh rotation on its first `resolveHeader()`.
- The bundled Anthropic Skills spec snapshot matches the live
  six-field upstream spec; `graphorin-disable-model-invocation` is
  retagged as a Graphorin-only extension.

### Observability, evals, pricing

- Replay sensitivity decisions are identical across trace sources:
  exporters serialize `sensitivityByAttribute` (spans and events) and
  prune entries for stripped attributes.
- `runEvals` gains `agentFactory` (one agent per worker) - the
  supported way to run framework agents at `concurrency > 1` - and a
  shared instance tripping the concurrent-run guard fails fast with
  `EvalConcurrencyError` instead of masquerading as scorer failures.
- `pricing refresh` accepts the live genai-prices bare-array
  `data.json`; `pricing lookup --json` serializes rates as clean
  decimals; `@graphorin/provider` exports `listMiddlewareKinds`.

### Examples & repo hygiene

- The flagship local examples (`local-stack-cli`,
  `personal-assistant-cli`) now genuinely persist and recall memory
  (per-turn session writes, consolidator turn triggers with
  auto-promotion, memory tools, context assembly, loopback provider
  trust) - their READMEs were true in spirit and are now true in
  fact; `slack-bot-integration` binds a real HTTP listener; the
  startup rule seeding is idempotent.
- The turbo `test` task depends on the package's own `build` (fixes a
  dist race under forced runs); the docs went through a seven-cluster
  verification sweep against the fixed tree (33 drift fixes, from a
  stale changelog mirror to a nonexistent systemd `ExecStart` path).

---

## 0.7.0 - 2026-07-07

The third framework-wide **remediation release** - all six waves of the
2026-07-05 project review of v0.6.1 (157 findings, a 151-work-item plan
across 16 clusters). Headlines: durable HITL now composes across the
sub-agent boundary, workflow timers fire on their own, session
hard-delete erases everything session-scoped, the server prunes derived
data by default, CommonJS consumers can plain `require()` every package
(Node floor 22.12), and zod 4 consumers typecheck. Per-package details
live in each package's `CHANGELOG.md`; upgrade notes are in the
migration guide (`documentation/guide/migration.md`).

### Security & data flow

- **Untrusted-content envelopes can no longer be spoofed or escaped**:
  `wrapEnvelope` neutralizes embedded `<<<untrusted_content>>>`
  delimiters, the memory consolidation + compaction prompts delimit
  stored memory text as data the same way, a new
  `untrusted-content-delimiter-injection` redaction pattern turns
  break-out attempts into an audit signal, and MCP `isError` text plus
  tool-schema annotations (the tool-poisoning class) are sanitized at
  the boundary.
- **The Rule-of-Two `untrustedInput` leg is actually enforced** (a
  profile that gives the leg up now forbids untrusted-source tools),
  the dataflow sink gate inspects post-repair arguments, spill handles
  are run-scoped with taint sidecars unreadable through `read_result`,
  cross-page imperative payloads are caught at spill time, and
  `containsPii` sees through Unicode obfuscation.
- **Server auth is attenuation-only and symmetric**: `POST /v1/tokens`
  refuses to mint scopes the minter's own grant does not cover;
  session REST/SSE reads honour per-resource scopes; run control binds
  to the run's owning agent/workflow; a malformed `/stream` body
  answers 400 instead of silently burning tokens; WS replay frames
  pass the same sanitizer as live delivery.
- **Audit chain**: cross-process fencing for append + prune, the
  `audit.cipher` setting is finally honoured (default pinned
  `chacha20`), `pruneAudit` survives the real driver and prompts
  re-anchoring, the skill trust root's `publishers` leg is
  cryptographically bound to the key-serving domain, and
  security-relevant tool events flow into the tamper-evident audit
  log by default (`audit.toolEvents`).

### Memory pipeline

- **Consolidation stops silently losing facts**: truncated
  (`finishReason: 'length'`) extractions split-and-retry or salvage
  the complete prefix, over-budget transcripts split before the
  provider call, a poison slice can no longer wedge the cursor forever
  (bounded skip), DLQ slice-capture is per-scope, and completion
  accounting is exception-safe (no more stuck scope locks).
- **Supersede keeps knowledge visible**: while a quarantined successor
  awaits validation the old fact stays recall-visible; quarantined
  insights no longer pass-decay before review; compaction
  summary-trust fails closed on scanner timeout.
- **Retrieval**: construction-time `searchDefaults` bring the advanced
  stack (multi-query, HyDE, graph expansion, fusion tuning) to
  `fact_search`, auto-recall and `deep_recall`; the trust discount
  applies before the final top-k cut; HyDE honours
  `includeSuperseded`/`owner`; multi-query fan-out embeds in one
  batch; the iterative-retrieval difficulty gate is tunable.
- **Scope-guarded mutators**: `forget`, `setStatus`, `archive`,
  `purge` and `markAccessed` accept a scope and no-op on foreign ids,
  symmetric with the read-side isolation.

### Workflow durability

- **Durable timers fire without user polling code**: suspended
  checkpoints carry `wakeAt` (migration 032), `createTimerDriver`
  ticks due threads, and the server binds it as a lifecycle daemon
  reported on `/v1/health`.
- **Replay is safer**: positional `pause()` replay detects divergence
  (typed `pause-replay-divergence`), the JSON-safety gate covers
  pause / approval / `Dispatch` / directive values, `maxSteps` caps
  per invocation (with an opt-in `maxTotalSteps` lifetime quota), and
  the docs stop calling side effects exactly-once (journaled channel
  writes replay once; effects are at-least-once).
- **The HTTP workflow surface exposes every durable primitive**: named
  awakeable `resume`, `retry`, `tick`, a real `fork`, per-thread
  `deleteThread` erasure, and machine-readable failure `code`s on the
  wire.

### Agent runtime & HITL

- **Durable HITL composes across the sub-agent boundary**: a handoff
  or `toTool` child suspending on an approval-gated tool parks on the
  parent (`RunState.pendingSubRuns`) instead of failing the run;
  decisions route on a composite key, the granted call executes
  exactly once, and nested parks recurse - serialized snapshots carry
  children version-stamped and secret-redacted.
- Delegated usage folds into the parent's accounting,
  `currentAgentId` is restored after a handoff, step numbers stay
  monotonic across suspend/resume, and the `onPendingApprovals` abort
  policy is reachable and consistent (`'fail'` only when approvals are
  actually pending).
- **One trace tree with child transparency**: the new `subagent.event`
  forwards child lifecycle events per `forwardEvents`, and
  handoff/`toTool` runs parent under the live step span.
- **Thinking-block signatures round-trip** (new `reasoning-end`
  provider event), so multi-step tool use with Anthropic extended
  thinking replays each block byte-equal; `RunContext.state` becomes a
  read-only projection; `AnyTool` and the exported `HandoffEntry` end
  the collection-seam casts.

### Storage & retention

- **The server prunes derived data by default**: a unified retention
  sweep (every 6 hours) deletes spans (30 d), consolidator run
  counters (90 d), exhausted DLQ batches (30 d) and expired
  idempotency records; primary content (sessions, audit, memory
  history, workflow threads) stays strictly opt-in;
  `retention: { enabled: false }` disables it.
- **Hard-delete means hard-delete**: session deletion erases every
  session-scoped surface via the schema-gated `SESSION_SCOPED_PURGES`
  registry (facts, insights, spans, working blocks) plus
  suspended-run checkpoints (migration 029).
- **Reachable retention levers**: `pruneSpans` and a real
  `graphorin traces prune` (previously a no-op against a phantom
  table), `graphorin memory prune-history`, checkpoint
  `pruneThreads`/`compactThread`, an opt-in agent
  `checkpointPolicy: 'delete-on-terminal'`, consolidator
  `dlq-list`/`dlq-clear`, and `graphorin storage compact` (incremental
  vacuum, FTS-safe).
- **Concurrency + integrity**: a migration-runner TOCTOU fence,
  read-only CLI commands stop auto-migrating live databases, a
  data-repair preflight on migration 022, typed `SqliteBusyError`,
  `encryptDatabase({ swap: true })` refuses under a live writer,
  `Float32Array` views serialize correctly, and `rules_fts` joins the
  FTS integrity guard. The schema advances to migration 032.

### MCP & tools

- **MCP server identity is transport-derived** - a server renaming
  itself can no longer mint fresh TOFU pins or claim a trusted handle
  scope; the pin lifecycle covers post-approval tool additions
  (rejected by default; `'accept-and-update'` for legitimate catalogue
  changes); the new `createManagedMCPClient` survives dead transports
  and re-screens the catalogue on reconnect.
- The ReDoS guard rejects the alternation-overlap family, SDK error
  classification is code-based (server-controlled text cannot forge
  timeout/cancel classes), and operator side-effect-class downgrades
  are visible (WARN + `downgradedTools`).
- **Executor honesty**: an inline timeout actually aborts the tool
  (and stops inviting unsafe retries of side-effecting calls), the
  `ToolReturn` envelope gains a symbol brand (extra result fields
  reach the model instead of being silently stripped), auto-prefix
  collision losers are always renamed or observably suppressed,
  streaming aggregation is bounded (8 MiB default), and tool
  discovery/grading is comment-aware.
- Tools/MCP counters land on `/v1/metrics` as Prometheus series.

### Provider adapters, pricing & observability

- **Streaming provider errors join the canonical taxonomy**: a
  pre-content 429/500/529 throws a typed retryable `ProviderHttpError`
  (retry and fallback finally engage on streaming steps); a mid-stream
  error classifies and finishes as `finishReason: 'error'`.
- Local adapters put images on the wire (`capabilities.multimodal`)
  and warn instead of silently dropping parts; `llamaCppNodeAdapter`
  speaks real chat history with an opt-in persistent session;
  `withRateLimit` gains a `tokensPerMinute` budget.
- `graphorin pricing refresh` works against the published
  `@pydantic/genai-prices` dataset, the `Cost.amount` units contract
  is pinned (whole currency units), and `CostTracker` tracks
  prompt-cache legs under bounded memory.
- Per-type sampling rules finally thin child spans, span events carry
  sensitivity tiers (`recordException` exports `exception.type`), and
  the phantom `@opentelemetry/*` peers are gone - with them the
  `ERESOLVE` trap of the stale caret pins.

### Server, wire & clients

- **Binary payloads survive the wire**: run-state schema 1.2 with
  `WireRunState`/`WireMessage` codecs (an image in a run checkpointed
  at `awaiting_approval` no longer corrupts on resume) and JSON-safe
  `WireAgentEvent` projections on the server WS path.
- The WS replay buffer is TTL-pruned (memory-leak fix), the client's
  per-subscription queue is bounded (typed `flow-overflow`), and a
  WS-to-SSE fallback closes unresumable subscriptions
  deterministically instead of hanging them.

### CLI

- `--json` mode honours exit codes (a broken audit hash chain no
  longer exits 0), `graphorin init` stops printing a dead bootstrap
  token and walks the real pepper -> `migrate` -> `token create` path
  (stdin, never argv), help text stops promising unimplemented
  persistence, and the `check-cli-docs` gate now validates required
  options.

### Packaging, types & release pipeline

- **Node floor 22.12; CommonJS consumers can plain `require()` every
  package** - export maps moved from the `import` condition to
  `default` (stable `require(esm)`), gated by attw `node16` and a
  require-smoke against packed tarballs.
- **zod ^4 actually typechecks** at `skipLibCheck: false` (the
  `ZodLikeError` shim widens to `PropertyKey`; shipped d.ts no longer
  bake concrete zod v3 generics). Phantom workspace dependencies are
  removed, every package declares `sideEffects`, tarballs ship `src/`
  so declaration maps resolve, and the server's sibling peer floors
  track the current minor.
- The core public API is snapshot-gated (api-extractor report + CI
  gate), and publishing moves to **npm trusted publishing (OIDC)** -
  no long-lived registry token; Sigstore provenance rides the same
  workflow identity.

### Documentation, evals & examples

- LOCOMO / LongMemEval loader fidelity (speaker names rendered,
  numeric reference answers kept, empty-reference questions skipped),
  a TSDoc `{@link}` sweep behind a validation gate, honesty fixes
  across READMEs and guides (WorkerPool, HITL event shapes, journal
  semantics, retention stories), and friendlier lint:
  `no-implicit-network-call` scopes to `@graphorin/` packages by
  default and `no-secret-unwrap` gains an `allowReceiverPattern`
  escape for Zod's `.unwrap()`.
- Doc gates go deny-by-default: snippet typechecking auto-discovers
  every page, a character-rules gate pins ASCII punctuation,
  `llms.txt` is compact again (the API index moves to `llms-api.txt`),
  and the examples' run-direct guard works on Windows.

## 0.6.1 - 2026-07-05

Patch release.

### Fixed

- **observability**: the default-on `graphorin-token` redaction pattern was
  hardcoded to a stale `kru_` token shape and never matched real framework
  tokens; it now matches the actual `gph_<env>_v1_<entropy>_<crc32>` format
  (deployments with a custom token prefix must register their own pattern).

### Changed

- **all packages**: version constants and version-bearing strings (writer
  ids, client/server info, OTLP attributes, the build-info metric) now derive
  from each package's manifest at build time; rendered values are
  byte-identical at this version. Release bumps no longer edit source, the
  remaining text surface is rewritten by `pnpm run bump-version -- --sync`,
  and the new `check-version-consistency` CI gate fails any reintroduced
  hardcoded framework version.

## 0.6.0 - 2026-07-05

The second framework-wide **audit release** - waves A-E of the 2026-07-04
audit (220 findings) - plus a full documentation accuracy + character-rules
sweep. Per-package details live in each package's `CHANGELOG.md`; upgrade
notes are in the migration guide (`documentation/guide/migration.md`).

### Security & correctness (waves A-B)

- Tool parameters are **real JSON Schema on the provider wire**: a structural
  Zod v3/v4 converter (`@graphorin/tools/schema`) replaces serialized
  validator internals; unprojectable schemas degrade loudly.
- **Durable HITL resume is exactly-once**: an approved call's resume writes a
  write-ahead intent checkpoint before dispatch and the journaled state after
  it; stale pre-execution snapshots stay bounded at one re-execution.
- Transcript well-formedness invariant in the step builder, hook-level
  `allowSensitivity`, session `purge()` cascade, `disableRepair`,
  `prefixMessages` token basis, spill-file taint sidecars,
  superseded-facts-excluded-by-default reads, an emergency compaction tier,
  IMMEDIATE SQLite transactions + an online backup API, MCP result-handle
  scoping + ReDoS guards, and the `ai` v7 provider-contract conversion.

### SOTA adopts (wave C)

- **Prompt-cache economics end-to-end**: `Usage` cache read/write legs, the
  opt-in `cachePolicy` breakpoint anchors, a cache-friendly tool catalogue,
  and cache-aware cost tracking over a regenerated pricing snapshot.
- Recoverable tool-error envelope + transparent bounded retry, the verifier
  seam, deterministic replay (`recordProviderResponses` +
  `createReplayProvider`), compaction hardening (`preserveUserMessages`),
  trust-aware recall ranking + `fitFusionWeights`, derived-taint `'strict'`
  mode with recall re-arm and MCP TOFU pinning, one-trace-tree `agent.run` /
  `agent.step` spans, and eval A/B switches with a non-self judge.

### Durable runtime (wave D)

- **Step-journal workflow durability**: durable timers, awakeables,
  approvals, and compare-and-set checkpoint writes
  (`CheckpointStore.put({ expectedLatestId })`); the `'async'` durability
  source is removed.
- Sub-agent isolation (read-only capability, `contextFold`, taint
  propagation), memory learned-context / owner / access-counters / runbooks
  (migrations 026-028), Merkle audit checkpoints + a skill-signing trust
  root + Progent / Rule-of-Two argument policies, and PPR-lite graph
  retrieval with entity-match fusion.

### Cross-cutting (wave E)

- **A ~2000x graph-CTE query-plan fix** in the SQLite store's entity
  expansion, found by the new 100k-fact scale probe (`benchmarks/scale`);
  the latency and memory-sim benchmark gates are armed for real.
- Release pipeline: the changesets 1.0.0 peer-escalation landmine defused
  (ranged internal peers + `onlyUpdatePeerDependentsWhenOutOfRange` +
  private-package ignore), tarball surface fixes (`@graphorin/memory`
  `./conflict` runtime-empty subpath, per-package CHANGELOG backfill),
  stricter `mvp-readiness` release gates.
- Supply chain + CI: SHA-256-pinned eval datasets (`scripts/datasets.lock.json`),
  failure notifications for scheduled workflows, job timeouts everywhere.
- Deployment templates fixed against reality (kubectl YAML-1.1 octal
  `defaultMode`, systemd `ExecReload` removal, docker config/secrets
  mounts), the Windows `storage cleanup-backups` no-op fixed, OTel GenAI
  span-name alignment, and eval statistics (Wilson intervals, pass^k,
  McNemar paired significance) attached to every eval summary.

### Documentation

- Every authored page re-verified against the code: 40 confirmed drift
  fixes (fictional `calculateCost` examples, health-check shapes,
  session-export record kinds, redaction-pattern catalogue, deployment
  template claims, and more), with the doc gates extended so the drift
  class cannot silently recur (28 compile-checked snippets, CLI-docs
  flag validation, anchor-checking lychee in offline file mode).
- A character-rules sweep across all markdown, TSDoc, and user-facing
  strings (ASCII punctuation only), and a new Performance & scale guide
  (`documentation/guide/performance.md`) with measured 100k-fact numbers.

## 0.5.0 - 2026-06-14

A framework-wide **audit-remediation** release - waves 0-4 of a 301-finding
security + correctness audit - plus SOTA adopts across memory, tools, and the
agent runtime. This is the **first release published to the npm registry**.

### Security & correctness

- Closed actively-exploitable holes: code-mode `process.env` exfiltration, the model-driven memory-quarantine bypass, object tool-outputs bypassing truncation + inbound sanitization, the encrypted-secrets-store silent data-loss path, the concurrent-`appendAudit` race, the GDPR `purge()` FK failure, idempotency-replay scope bypass, and per-IP rate-limit spoofing.
- Fail-loud over silent corruption: secrets/audit write paths, provider retry + fallback on network errors, and four trigger-scheduler bugs (spurious catch-up, interval double-fire, error-death, long-horizon `setTimeout` overflow).

### Completed core mechanisms

- Durable HITL resume now executes an approved tool exactly once; workflow crash-recovery + frontier persistence; `ContextEngine.assemble()`, guardrails, structured `outputType`, and the previously-inert `AgentConfig` fields are wired or removed.
- Memory: tokenized FTS recall, honest metadata counts, server-wired background consolidation, real sliding-window cost budgets, and a quarantine promotion path.
- Streaming server end-to-end (SSE / WebSocket), config-driven storage encryption, provider request timeouts + JSON-mode, and the Vercel AI SDK v7 chunk shapes.

### SOTA adopts (eval-gated)

- Compaction clearing-tier with recoverable `read_result` handles + reclaim-floor and Errors/Next-steps summary sections; the FIDES data-flow lattice; prompt-cache-aware tool catalogue with worked tool-use examples and end-to-end structured output; step-journal exactly-once resume; OpenTelemetry GenAI span mapping.

### Hardening & honesty (wave 4)

- Obfuscation-resistant taint detection, opt-in deny-wins supply-chain precedence, audit-prune + 1Password-CLI-timeout fixes, all-occurrence / cross-delta redaction, a cross-embedder entity-resolution guard, revived no-network guard coverage, and a documented security **Known limitations** section.

## 0.4.0 - 2026-05-26

The **memory program** (P0-1 … P2-2) - a research-grade rebuild of
`@graphorin/memory`.

### Added

- **Temporal memory** - bitemporal `as_of` reads and a `fact_history` tool (migration 013).
- **Injection defense** - provenance + quarantine on extracted facts, an agent-callable `fact_validate` promotion gate, and offline injection heuristics.
- **Consolidation** - neighbour-aware extract→reconcile, auto-importance + episode formation, and deep-phase reflection that synthesises read-only **insights** (migration 014).
- **Retrieval** - contextual retrieval with late-chunking (default), query transformation (multi-query / RAG-Fusion + opt-in HyDE), weighted/convex fusion, an in-SQLite **entity graph** with one-hop expansion (migrations 015-016), agentic/iterative retrieval (`deep_recall`), and **procedural memory** induction (migration 017).
- **Hygiene** - multi-signal forgetting / capacity-bounded eviction, and recall introspection (`graphorin memory inspect` / `activity`).
- An offline-first **eval harness** (`@graphorin/evals`) with LongMemEval / LOCOMO loaders.

## 0.3.0 - 2026-05-24

**Tools & harness** end-to-end (WI-01 … WI-13).

### Added

- **Defer-loading tool catalogue** - large tool sets are summarised; full schemas load on demand through a Tool Search seam.
- **Spill-to-handle results** - oversized tool outputs spill to a handle re-fetchable via `read_result`, bounding context growth.
- **Code-mode execution** - the model can drive tools through a sandboxed code API instead of one call per step.
- **Deterministic dataflow / taint policy** - opt-in `dataFlowPolicy: 'shadow' | 'enforce'` gates untrusted-to-sink flows and the lethal trifecta at `executeOne`.
- **MCP surface completion** - `resource_link` → handles, gated elicitation / sampling hooks, and composable result readers.

## 0.2.0 - 2026-05-21

A hardening / quick-wins maintenance release driven by an internal
action-item audit: dependency and supply-chain hygiene, CI tightening,
and assorted correctness fixes across the runtime and tooling.

## 0.1.0 - 2026-05-09

The first tagged version of the Graphorin framework. All `@graphorin/*`
packages are versioned together at `0.1.0` (lockstep on the `0.x`
line).

### Added

#### Runtime, memory, workflow

- `@graphorin/agent` - agent runtime with streaming events, steering /
  follow-up queues, `prepareStep` hook, HITL durable resume, multi-agent
  handoffs (`Agent.toTool({ secretsInheritance })`), composable stop
  conditions, fan-out + evaluator-optimizer loops, structured-handoff
  artifacts.
- `@graphorin/memory` - six-tier memory: working / session / episodic /
  semantic (bi-temporal default-on) / procedural / shared. Multi-stage
  conflict resolution (exact dedup → embedding three-zone → heuristic
  regex → subject/predicate). Hybrid search with Reciprocal Rank Fusion
  default. Memory-aware system prompt with built-in English locale pack
  and a pluggable per-locale extension point. Background consolidator
  with `light` + `standard` + minimum-viable `deep` phases, mandatory
  noise filter, lock-then-defer policy, idempotency cursor, dead-letter
  queue, and a default `tier: 'free'` cost budget.
- `@graphorin/workflow` - durable step-graph runtime with a
  synchronous-step model, in-memory channels (`LatestValue`, `Reducer`,
  `Stream`, `Barrier`, `Ephemeral`, `AnyValue`, `ListAggregate`),
  `pause` (HITL) / `resume`, four stream modes (`values` / `updates` /
  `tasks` / `debug`), `Directive` and `Dispatch` primitives.
- `@graphorin/sessions` - hybrid session facade with the agent registry,
  handoff records, JSONL export schema 1.0, and replay reconstruction.
  Session messages are owned by `@graphorin/memory` (single source of
  truth, DEC-147).

#### External surface

- `@graphorin/tools` - typed tool registry, parallel execution,
  `needsApproval` flow, sandboxed execution, four-strategy result
  truncation pipeline, streaming-tool execution surface, built-in
  `tool_search` lookup tool.
- `@graphorin/skills` - Anthropic Agent Skills format compatible loader
  with `graphorin-*` namespaced extensions; ed25519 signature
  verification on install (DEC-140 / ADR-034); slash commands
  (`/skill:name`); progressive-disclosure activation; sandbox-tier-aware
  execution.
- `@graphorin/mcp` - Model Context Protocol client (stdio +
  Streamable HTTP + legacy SSE); typed `MCPClient`; `toTools()` adapter
  with inbound prompt-injection sanitization, deferred-loading auto-default,
  structured-content + outputSchema round-trip, per-server priority and
  collision strategy; pluggable `EventStore` for resumable sessions;
  OAuth bridge backed by `@graphorin/security/oauth`.

#### Persistence + provider

- `@graphorin/store-sqlite` - default storage adapter on top of
  `better-sqlite3@^12.9.0` + `sqlite-vec@~0.1.9` + FTS5 with
  `unicode61 remove_diacritics 2 tokenchars '-_.@/'`. WAL hardening
  pragmas, WorkerPool wrapper for the standalone server.
- `@graphorin/embedder-transformersjs` - default in-process embedder
  (`Xenova/multilingual-e5-base`, multilingual). WebGPU when available.
- `@graphorin/embedder-ollama` - first-class opt-in alternative against
  an Ollama daemon (`nomic-embed-text` default, multi-model support).
- `@graphorin/triggers` - cron / interval / idle / event triggers; same
  code path in library and standalone-server modes (DEC-150).
- `@graphorin/provider` - vendor-neutral `Provider` interface; default
  `vercelAdapter` wrapping the Vercel AI SDK (v7 beta); `ollamaAdapter`,
  `llamaCppServerAdapter`, and `openAICompatibleAdapter` for local LLMs;
  shared `LocalProviderTrust` classifier; provider middleware composer
  with enforced ordering (DEC-145 / ADR-039) - `withRedaction` is
  mandatory innermost.
- `@graphorin/provider-llamacpp-node` - companion package for
  in-process GGUF execution via `node-llama-cpp@^3.5`.

#### Cross-cutting infrastructure

- `@graphorin/security` - `SecretValue` wrapper end-to-end with
  leakage barriers; `SecretRef` URI scheme (`env:` / `keyring:` /
  `file:` / `encrypted-file:` / `op://` / `vault://` / `ref:`);
  `KeyringSecretsStore` default via `@napi-rs/keyring`; sandbox tiers
  (`worker-threads` default + `docker` + `isolated-vm` + `none`);
  memory-modification guard (xxhash-fingerprint hash chain);
  HMAC-SHA256 + pepper server-token auth (DEC-122 / ADR-027);
  encrypted `audit.db` with SHA-256 hash chain; OAuth flows via
  `openid-client@^6.x`; ed25519 skill-signature verifier; process
  hardening (umask, refuse-root, file-mode policy).
- `@graphorin/observability` - OpenTelemetry tracer with GenAI Semantic
  Conventions; typed `AISpan<SpanType>`; `ConsoleExporter` /
  `JSONLExporter` / `OTLPHttpExporter` with mandatory
  `RedactionValidator` (default-deny non-public, DEC-141 / ADR-035).
  Eval interfaces only; the full eval framework ships in
  `@graphorin/evals`.
- `@graphorin/pricing` - separate package; bundled
  `@pydantic/genai-prices` snapshot; `graphorin pricing refresh`
  opt-in (never invoked automatically).

#### Standalone runtime

- `@graphorin/server` - optional REST + WebSocket + SSE runtime built
  on Hono. REST `Idempotency-Key` per IETF draft-07 (DEC-142 /
  ADR-036), durable HITL across process restarts, lifecycle hooks,
  triggers daemon, consolidator daemon, replay endpoints, `/v1/health`
  + `/v1/metrics` (Prometheus, opt-in auth), audit verify endpoint.
- `@graphorin/cli` - operator CLI binary (`graphorin start | init |
  migrate | doctor | token | secrets | storage | audit | memory |
  consolidator | triggers | auth | pricing | skills | traces |
  migrate-export | guard | telemetry`).
- `@graphorin/protocol` - browser-friendly schemas for the WebSocket
  protocol contract `graphorin.protocol.v1` (DEC-127 / ADR-031).
- `@graphorin/client` - browser-friendly TypeScript client for the
  standalone server.

#### Optional sub-packs

- `@graphorin/store-sqlite-encrypted` - SQLCipher v4 encryption-at-rest
  via `better-sqlite3-multiple-ciphers@^12.9.0` (DEC-129 / ADR-030).
  Required for the always-encrypted `audit.db` on fresh installations.
- `@graphorin/secret-1password` - reference `SecretResolver` for
  `op://` URIs through the 1Password CLI.
- `@graphorin/reranker-transformersjs` - pluggable cross-encoder
  reranker on top of `@huggingface/transformers`.
- `@graphorin/reranker-llm` - pluggable LLM-judge reranker.
- `@graphorin/eslint-plugin` - ESLint rules for projects that build
  on Graphorin (`no-secret-unwrap`, `no-secret-in-deps`,
  `provider-middleware-order`, `no-implicit-network-call`,
  `no-third-party-workflow-aliases`, `no-bare-tool-exec`,
  tool-discovery surface).
- `@graphorin/evals` - full evaluation framework (scorers, datasets,
  runner, reporters; decoupled from `@graphorin/observability` per
  RB-17 / DEC-152).

### Privacy and security baselines

- **Zero default telemetry** (DEC-154 / ADR-041). The framework
  generates no outbound network call you did not initiate. The CI
  workflow `check-no-network.yml` enforces this against the source
  tree on every push and pull request.
- **Sigstore build provenance** on every published package
  (`publishConfig.provenance: true` + `npm provenance` on the GitHub
  Actions release workflow).
- **Pre-launch security audit** completed against the project's STRIDE
  threat model and the OWASP LLM Top 10 (2025): 0 Critical, 0 High
  findings; Medium / Low findings documented with v0.2 owners.

### Examples

The repository ships eight example apps:

- `personal-assistant-cli` - single-agent local CLI (library mode,
  hello-world target).
- `slack-bot-integration` - server mode + WebSocket + durable HITL
  approvals across server restart.
- `background-consolidator` - server mode + cron triggers + light /
  standard consolidator phases.
- `multi-agent-crew` - supervisor + 2 worker agents (RB-33 acceptance
  scenario).
- `approval-workflow` - `@graphorin/workflow` HITL durable resume via
  `pause()` / `Directive(resume)` across server restart.
- `document-pipeline` - `@graphorin/workflow` `Dispatch` + parallel
  nodes + every channel type.
- `three-agent-harness` - Planner / Generator / Evaluator harness
  with structured-handoff artifacts; `Agent.fanOut(...)` +
  `evaluatorOptimizer(...)` (RB-50 reference).
- `local-stack-cli` - fully local stack (Ollama LLM + Ollama
  embeddings + SQLite + sqlite-vec, no cloud calls).

Distribution templates: `docker/`, `k8s/`, `systemd/`, `github-actions/`.

### Benchmarks

- `benchmarks/locomo` - LoCoMo benchmark runner (10 conversations,
  200 questions); per-question accuracy + per-conversation aggregates
  + cost summary.
- `benchmarks/locomo-multilingual` - community-contribution hooks for
  per-locale subsets.
- `benchmarks/dialogue-smoke` - dialogue smoke test (wiring check; not
  the published DialSim benchmark).
- `benchmarks/memory-sim` - synthetic-dialogue memory simulator.
- `benchmarks/latency` - p50 / p95 FTS memory-search latency probe.
- `benchmarks/cost` - per-conversation token-cost regression suite
  (CI budget assertion, must not increase > 10 % between runs).

### Documentation

- Per-package `README.md` covers the public surface, configuration,
  and dependency footprint.
- `SECURITY.md` documents the disclosure process, supported versions,
  cryptographic baselines, and the privacy promise.
- `CONTRIBUTING.md` covers the development workflow, conventions, and
  commit format.
- `CODE_OF_CONDUCT.md` reproduces the unmodified Contributor Covenant
  v2.1 text.
- `THIRD_PARTY_NOTICES.md` lists every runtime, optional, and
  build-time dependency with its license and the role it plays in
  Graphorin.

### Hello-world target

A 20-line script that creates a memory-backed agent, streams tokens,
persists facts to local SQLite via local `transformers.js` embeddings,
survives process restart for HITL approvals when run via
`graphorin start`, and emits OpenTelemetry spans (file or console
exporter). The example lives in `examples/personal-assistant-cli/`.

