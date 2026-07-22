/**
 * Sustained-concurrency load driver for the weekly soak leg
 * (.github/workflows/soak.yml).
 *
 * Hammers POST /v1/agents/soak-agent/run (a FULL server agent turn:
 * auth, agent runtime, stub-provider stream, run tracking, SQLite)
 * with a fixed worker count until the deadline, then gates on the
 * published SLOs (documented in documentation/guide/operations.md):
 *
 *  - zero 5xx and zero transport errors;
 *  - zero non-200 responses of any kind;
 *  - p95 latency under SOAK_P95_MS (default 1000 ms - generous on
 *    purpose: shared CI runners are noisy neighbours, and this gate
 *    exists to catch order-of-magnitude regressions, not 10% drift);
 *  - server RSS under SOAK_RSS_MAX_MB (default 1024 MB);
 *  - no unbounded growth: mean RSS over the last quarter of the run
 *    must stay under 2x the first quarter + 64 MB slack.
 *
 * Env: SOAK_URL, SOAK_TOKEN, SOAK_SECONDS (default 180),
 * SOAK_CONCURRENCY (default 8), SOAK_SERVER_PID (enables RSS
 * sampling), SOAK_P95_MS, SOAK_RSS_MAX_MB. Writes a markdown table to
 * GITHUB_STEP_SUMMARY when present and always prints a JSON summary
 * line; exits nonzero listing every violated SLO.
 */

import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';

const url = required('SOAK_URL');
const token = required('SOAK_TOKEN');
const seconds = intEnv('SOAK_SECONDS', 180);
const concurrency = intEnv('SOAK_CONCURRENCY', 8);
// Paced, not max-throughput: a soak proves steady-state endurance.
// Unpaced, the ~1ms stub turns drive 10k+ runs/s - orders of magnitude
// beyond any real LLM deployment - and the run tracker's (bounded,
// 5-minute) terminal-record retention window then legitimately holds
// millions of records. 300 rps is still far above real agent traffic
// while keeping the retention window's memory footprint honest.
const rps = intEnv('SOAK_RPS', 300);
const serverPid = process.env.SOAK_SERVER_PID ? Number(process.env.SOAK_SERVER_PID) : undefined;
const p95BudgetMs = intEnv('SOAK_P95_MS', 1000);
const rssMaxMb = intEnv('SOAK_RSS_MAX_MB', 1024);

function required(name) {
  const v = process.env[name];
  if (v === undefined || v === '') {
    console.error(`soak-driver: env ${name} is required`);
    process.exit(2);
  }
  return v;
}

function intEnv(name, fallback) {
  const v = process.env[name];
  if (v === undefined || v === '') return fallback;
  const n = Number.parseInt(v, 10);
  if (!Number.isFinite(n) || n <= 0) {
    console.error(`soak-driver: env ${name} must be a positive integer, got '${v}'`);
    process.exit(2);
  }
  return n;
}

/** RSS of the target pid in MB, or null when unreadable. */
function sampleRssMb(pid) {
  try {
    // Linux: authoritative and cheap.
    const status = readFileSync(`/proc/${pid}/status`, 'utf8');
    const m = /VmRSS:\s+(\d+)\s+kB/.exec(status);
    if (m) return Number(m[1]) / 1024;
  } catch {
    // fall through to ps (macOS local runs)
  }
  try {
    const out = execFileSync('ps', ['-o', 'rss=', '-p', String(pid)], { encoding: 'utf8' });
    const kb = Number.parseInt(out.trim(), 10);
    if (Number.isFinite(kb)) return kb / 1024;
  } catch {
    return null;
  }
  return null;
}

function quantile(sorted, q) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil(q * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

const latencies = [];
const statusCounts = new Map();
let transportErrors = 0;
let requests = 0;
const rssSamples = [];

const deadline = Date.now() + seconds * 1000;
// Agent instances are single-flight by contract (ConcurrentRunError);
// the soak app registers a pool and each worker owns one instance, so
// contention 409s never muddy the SLO verdict. Keep in sync with
// AGENT_POOL in .github/smoke/soak.app.mjs.
const agentPool = intEnv('SOAK_AGENT_POOL', 16);
const endpointFor = (workerId) =>
  `${url.replace(/\/$/, '')}/v1/agents/soak-agent-${workerId % agentPool}/run`;

const rssTimer =
  serverPid !== undefined
    ? setInterval(() => {
        const mb = sampleRssMb(serverPid);
        if (mb !== null) rssSamples.push(mb);
      }, 5000)
    : undefined;
rssTimer?.unref?.();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
/** Per-worker gap between request STARTS that yields the global rps. */
const paceMs = (1000 * concurrency) / rps;

async function worker(id) {
  const endpoint = endpointFor(id);
  let n = 0;
  while (Date.now() < deadline) {
    n += 1;
    requests += 1;
    const slotStart = performance.now();
    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ input: `soak-${id}-${n}` }),
      });
      // Drain the body so keep-alive sockets recycle cleanly.
      await resp.text();
      latencies.push(performance.now() - slotStart);
      statusCounts.set(resp.status, (statusCounts.get(resp.status) ?? 0) + 1);
    } catch {
      transportErrors += 1;
    }
    const wait = paceMs - (performance.now() - slotStart);
    if (wait > 0) await sleep(wait);
  }
}

const startedAt = Date.now();
await Promise.all(Array.from({ length: concurrency }, (_, i) => worker(i)));
if (rssTimer !== undefined) clearInterval(rssTimer);
const elapsedS = (Date.now() - startedAt) / 1000;

latencies.sort((a, b) => a - b);
const ok = statusCounts.get(200) ?? 0;
const non200 = requests - transportErrors - ok;
const fiveHundreds = [...statusCounts.entries()]
  .filter(([status]) => status >= 500)
  .reduce((sum, [, count]) => sum + count, 0);
const p50 = quantile(latencies, 0.5);
const p95 = quantile(latencies, 0.95);
const p99 = quantile(latencies, 0.99);
const max = latencies.at(-1) ?? 0;
const achievedRps = requests / Math.max(1, elapsedS);

const quarter = Math.max(1, Math.floor(rssSamples.length / 4));
const meanOf = (arr) => (arr.length === 0 ? null : arr.reduce((a, b) => a + b, 0) / arr.length);
const rssFirstQuarter = meanOf(rssSamples.slice(0, quarter));
const rssLastQuarter = meanOf(rssSamples.slice(-quarter));
const rssPeak = rssSamples.length > 0 ? Math.max(...rssSamples) : null;

const violations = [];
if (transportErrors > 0) violations.push(`${transportErrors} transport error(s)`);
if (fiveHundreds > 0) violations.push(`${fiveHundreds} 5xx response(s)`);
if (non200 > 0) violations.push(`${non200} non-200 response(s)`);
if (p95 > p95BudgetMs) violations.push(`p95 ${p95.toFixed(0)}ms > budget ${p95BudgetMs}ms`);
if (rssPeak !== null && rssPeak > rssMaxMb) {
  violations.push(`peak RSS ${rssPeak.toFixed(0)}MB > budget ${rssMaxMb}MB`);
}
if (
  rssSamples.length >= 8 &&
  rssFirstQuarter !== null &&
  rssLastQuarter !== null &&
  rssLastQuarter > rssFirstQuarter * 2 + 64
) {
  violations.push(
    `RSS growth: last-quarter mean ${rssLastQuarter.toFixed(0)}MB vs ` +
      `first-quarter mean ${rssFirstQuarter.toFixed(0)}MB (leak heuristic)`,
  );
}

const summary = {
  seconds: Math.round(elapsedS),
  concurrency,
  requests,
  ok,
  non200,
  transportErrors,
  statuses: Object.fromEntries([...statusCounts.entries()].sort((a, b) => a[0] - b[0])),
  targetRps: rps,
  rps: Number(achievedRps.toFixed(1)),
  p50Ms: Number(p50.toFixed(1)),
  p95Ms: Number(p95.toFixed(1)),
  p99Ms: Number(p99.toFixed(1)),
  maxMs: Number(max.toFixed(1)),
  rssFirstQuarterMb: rssFirstQuarter === null ? null : Number(rssFirstQuarter.toFixed(0)),
  rssLastQuarterMb: rssLastQuarter === null ? null : Number(rssLastQuarter.toFixed(0)),
  rssPeakMb: rssPeak === null ? null : Number(rssPeak.toFixed(0)),
  violations,
};
console.log(`soak-summary ${JSON.stringify(summary)}`);

if (process.env.GITHUB_STEP_SUMMARY) {
  const md = [
    '## Soak run (stub provider, full server turn)',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| Duration | ${summary.seconds}s at concurrency ${concurrency} |`,
    `| Requests | ${requests} (${summary.rps} req/s) |`,
    `| OK / non-200 / transport errors | ${ok} / ${non200} / ${transportErrors} |`,
    `| Latency p50 / p95 / p99 / max | ${summary.p50Ms} / ${summary.p95Ms} / ${summary.p99Ms} / ${summary.maxMs} ms |`,
    `| Server RSS first-quarter / last-quarter / peak | ${summary.rssFirstQuarterMb ?? 'n/a'} / ${summary.rssLastQuarterMb ?? 'n/a'} / ${summary.rssPeakMb ?? 'n/a'} MB |`,
    `| SLO verdict | ${violations.length === 0 ? 'PASS' : `FAIL: ${violations.join('; ')}`} |`,
    '',
  ].join('\n');
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${md}\n`);
}

if (violations.length > 0) {
  for (const v of violations) console.error(`::error::soak SLO violated: ${v}`);
  process.exit(1);
}
console.log('soak OK: all SLOs held');
