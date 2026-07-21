#!/usr/bin/env node
/**
 * Smoke-tests the runnable `examples/*` apps against the deterministic
 * `stub` LLM recipe so a public-API regression in any `@graphorin/*`
 * package fails CI loudly instead of silently breaking the examples.
 *
 * Each example is spawned with a hard timeout. Happy-path examples must
 * exit 0; `local-stack-cli` is exercised on its fail-fast path
 * (`GRAPHORIN_OFFLINE=1`) and must exit 2 with an actionable message.
 *
 * Run locally: `node ./scripts/smoke-examples.mjs`
 * Used by CI:  `.github/workflows/ci.yml` (job `examples-smoke`).
 *
 * deep-retest-0.13.11: `--exclude <name>` (repeatable, or a
 * comma-separated list; also `GRAPHORIN_SMOKE_EXCLUDE=a,b`) skips
 * named examples - external audits that must not execute
 * security-flavoured samples (e.g. `secure-replay-agent`) get an
 * official switch instead of ad-hoc source edits. Unknown names fail
 * loudly, and every exclusion is printed so a partial run can never
 * read as full coverage.
 */

import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const TIMEOUT_MS = 90_000;

/**
 * @typedef {Object} Case
 * @property {string} name          Workspace dir under `examples/`.
 * @property {Record<string,string>} [env]  Extra env vars.
 * @property {string} [stdin]       Piped stdin (for interactive CLIs).
 * @property {number} [expectExit]  Required exit code (default 0).
 * @property {string} [expectOutput] Substring that must appear in output.
 */

/** @type {Case[]} */
const CASES = [
  { name: 'approval-workflow', expectOutput: 'durable primitives: OK' },
  // F6: the official whole-bot recipe (agent + memory + sessions +
  // server HITL + heartbeat + channels front door).
  { name: 'assistant-bot', expectOutput: 'assistant-bot: OK' },
  { name: 'document-pipeline' },
  { name: 'background-consolidator' },
  { name: 'multi-agent-crew' },
  { name: 'three-agent-harness' },
  // Interactive REPL — EOF on empty stdin ends the loop cleanly.
  { name: 'personal-assistant-cli', stdin: 'Hello, what can you do?\n' },
  {
    name: 'slack-bot-integration',
    env: {
      GRAPHORIN_SLACK_SIGNING_SECRET: 'test-signing-secret-for-smoke',
      GRAPHORIN_SLACK_BOT_PEPPER: 'test-pepper-32-bytes-aaaaaaaaaaaa',
    },
  },
  // Fail-fast path: no Ollama daemon in CI. Force the network-backed
  // `ollama` recipe (the `stub` recipe needs no network, so it would
  // never trip the offline guard) and assert the actionable offline
  // error + exit 2 rather than the (unreachable) happy path.
  // W-099: the 0.3-0.6 feature-line examples. Each asserts its final
  // summary line; secure-replay-agent additionally pins the enforce
  // stage's blocked sink.
  { name: 'tools-harness-tour', expectOutput: 'tools-harness-tour: OK' },
  { name: 'memory-graph-recall', expectOutput: 'memory-graph-recall: OK' },
  { name: 'secure-replay-agent', expectOutput: 'sink blocked' },
  // Audit item 9: structured output + response verifiers, end-to-end.
  { name: 'structured-verifier', expectOutput: 'verifierRounds=1: OK' },
  // F-02: pin the case to a throwaway DB and a guaranteed-dead loopback
  // port so a live local Ollama daemon or a stale dev database in
  // examples/local-stack-cli/.graphorin cannot change its path.
  {
    name: 'local-stack-cli',
    env: {
      GRAPHORIN_LLM_RECIPE: 'ollama',
      GRAPHORIN_OFFLINE: '1',
      GRAPHORIN_OLLAMA_BASE_URL: 'http://127.0.0.1:59999',
      GRAPHORIN_DB_PATH: join(tmpdir(), `graphorin-smoke-local-stack-${process.pid}.db`),
    },
    expectExit: 2,
    expectOutput: 'GRAPHORIN_OFFLINE',
  },
];

function parseExcludes(argv, envValue) {
  const raw = [];
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--exclude') {
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) {
        console.error('smoke-examples: --exclude requires a value');
        process.exit(1);
      }
      raw.push(next);
      i += 1;
    } else {
      console.error(
        `smoke-examples: unknown option ${argv[i]} (only --exclude <name> is supported)`,
      );
      process.exit(1);
    }
  }
  if (envValue) raw.push(envValue);
  const names = raw
    .flatMap((v) => v.split(','))
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
  const known = new Set(CASES.map((c) => c.name));
  for (const name of names) {
    if (!known.has(name)) {
      console.error(`smoke-examples: --exclude names an unknown example: ${name}`);
      process.exit(1);
    }
  }
  return new Set(names);
}

const excluded = parseExcludes(process.argv, process.env.GRAPHORIN_SMOKE_EXCLUDE);
for (const name of excluded) {
  console.log(`smoke-examples: EXCLUDED ${name} (--exclude / GRAPHORIN_SMOKE_EXCLUDE)`);
}
const selected = CASES.filter((c) => !excluded.has(c.name));

let failures = 0;

for (const c of selected) {
  const expectExit = c.expectExit ?? 0;
  const env = { ...process.env, GRAPHORIN_LLM_RECIPE: 'stub', ...(c.env ?? {}) };
  const started = Date.now();
  const result = spawnSync('pnpm', ['--filter', `./examples/${c.name}`, 'dev'], {
    env,
    input: c.stdin ?? '',
    encoding: 'utf8',
    timeout: TIMEOUT_MS,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const ms = Date.now() - started;
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;

  const timedOut = result.error?.code === 'ETIMEDOUT';
  const exitOk = !timedOut && result.status === expectExit;
  const outputOk = c.expectOutput === undefined || output.includes(c.expectOutput);

  if (exitOk && outputOk) {
    console.log(`✅ ${c.name} (exit ${result.status}, ${ms} ms)`);
  } else {
    failures += 1;
    const why = timedOut
      ? `timed out after ${TIMEOUT_MS} ms`
      : !exitOk
        ? `exit ${result.status} (expected ${expectExit})`
        : `output missing ${JSON.stringify(c.expectOutput)}`;
    console.error(`❌ ${c.name} — ${why}`);
    console.error(output.split('\n').slice(-25).join('\n'));
  }
}

if (failures > 0) {
  console.error(`\nsmoke-examples: FAIL — ${failures} example(s) broken.`);
  process.exit(1);
}
const excludedNote = excluded.size > 0 ? ` (${excluded.size} excluded by request)` : '';
console.log(`\nsmoke-examples: PASS — ${selected.length} example(s) ran clean.${excludedNote}`);
