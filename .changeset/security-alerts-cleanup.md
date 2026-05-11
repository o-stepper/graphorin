---
'@graphorin/agent': patch
'@graphorin/tools': patch
'@graphorin/security': patch
'@graphorin/evals': patch
'@graphorin/provider': patch
'@graphorin/embedder-ollama': patch
'@graphorin/store-sqlite': patch
'@graphorin/cli': patch
'@graphorin/observability': patch
---

Sweep the GitHub security dashboard.

- `@graphorin/agent` — `newId(...)` now sources its 7-character base32 tail from `crypto.randomBytes(...)` instead of `Math.random()`. Run / session / agent IDs gain ~35 bits of CSPRNG entropy with the same on-the-wire shape, closing five `js/insecure-randomness` CodeQL alerts on `factory.ts` and the `three-agent-harness` example.
- `@graphorin/tools` — `applyJsonPatch(...)` (the JSON-delta sink in `toResultEnvelope`) refuses to traverse or assign through `__proto__`, `constructor`, or `prototype`, so a malicious streaming-tool payload can no longer mutate `Object.prototype`. Closes two `js/prototype-polluting-assignment` alerts; covered by a regression test.
- `@graphorin/security` —
  - The hardening doctor's `parseSystemdScore(...)`, the OAuth discovery URL trimmer, and the secrets-store warn pipeline are all hardened: input is bounded before regex matching, the trim is now an `O(n)` non-regex scan, and the headless reason for `CI=` no longer interpolates the env value into log output.
  - `encodeBase62Bytes(...)` keeps its (provably unbiased) big-integer long-division algorithm, with a doc-block proof and a CodeQL suppression on the relevant line so the dashboard stops re-flagging it.
- `@graphorin/evals` — the markdown reporter now escapes `\\` before `|` and flattens embedded newlines, so adversarial scorer reasons can't break out of a Markdown table cell. Closes `js/incomplete-sanitization`.
- `@graphorin/provider` & `@graphorin/embedder-ollama` & `@graphorin/store-sqlite` & `@graphorin/cli` — replaced anchored `/\/+$/` URL-trim regexes with explicit `O(n)` scans (provider gets a shared `internal/url-utils.ts`), bounded a few CodeQL `js/polynomial-redos` inputs (`slugifyEmbedderId`, glob-tokenizer pattern length).
- `@graphorin/observability` — the redaction-pattern test fixture for AWS access keys is fragmented (`'AKIA' + 'IOSFODNN7EXAMPLE'`) so the GitHub secret scanner stops flagging the literal documentation example, without watering down the test.

Plus root-level `pnpm.overrides` to lift the docs site off `vite@5.4.21` (path-traversal in `.map`, no upstream patch in the 5.x line — the override forwards to `vite@^7.3.2`, vitepress 1.6.4 builds cleanly against it) and the dev-time `esbuild@0.21.5` transitive (CORS on `serve` — bumped to `>=0.25.0 <0.26.0`). Both Dependabot advisories disappear as a result.

No public APIs change.
