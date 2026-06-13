#!/usr/bin/env node
/**
 * check-no-network.mjs
 *
 * Static guard for Graphorin's "no implicit network calls" promise
 * (DEC-154 / ADR-041; see SECURITY.md § Privacy & telemetry). Scans
 * `packages/*\/src/**\/*.ts` for outbound network primitives and
 * fails the run if a forbidden call is found outside the allow-list.
 *
 * The allow-list covers code paths that are permitted to make network
 * calls — every entry corresponds to an explicit user-initiated action
 * (provider adapter, MCP transport, OAuth flow, opt-in pricing
 * refresh, embedder model download, storage backend, OTLP exporter).
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

/**
 * Forbidden CALL-SITE patterns. Tested against comment- AND string-
 * stripped source so a `fetch(` inside a string literal is not a false
 * positive.
 */
const CALL_PATTERNS = [
  ['fetch', /(^|[^A-Za-z0-9_$.])fetch\s*\(/m],
  ['http.request', /\bhttp\.request\s*\(/m],
  ['https.request', /\bhttps\.request\s*\(/m],
  ['http.get', /\bhttp\.get\s*\(/m],
  ['https.get', /\bhttps\.get\s*\(/m],
  ['net.createConnection', /\bnet\.(?:createConnection|connect)\s*\(/m],
  ['tls.connect', /\btls\.connect\s*\(/m],
  ['dgram.createSocket', /\bdgram\.createSocket\s*\(/m],
  ['WebSocket', /\bnew\s+WebSocket\s*\(/m],
  // EB-10: browser-style network primitives a polyfill/bundler can expose.
  ['XMLHttpRequest', /\bnew\s+XMLHttpRequest\s*\(/m],
  ['EventSource', /\bnew\s+EventSource\s*\(/m],
  // EB-10: namespace-bound HTTP-client calls, e.g. `undici.request(...)`.
  ['undici/got call', /\b(?:undici|got)\.(?:request|stream|fetch|get|post)\s*\(/m],
];

/**
 * Forbidden IMPORT patterns. Import specifiers ARE string literals, so
 * these run against COMMENT-stripped but string-PRESERVING source —
 * stripping strings (as the call-site pass does) blanks the specifier,
 * which is exactly why the prior single import pattern was inert (EB-10).
 * Covers static `import`, dynamic `import(...)`, and `require(...)`. The
 * trade-off: a string literal that itself contains an import-of-a-client
 * is a (rare, easily-resolved) false positive — over-flagging is the
 * safe direction for a no-network guard.
 */
const HTTP_CLIENT_SPECIFIERS = '(?:node-fetch|undici|got|axios|ky|ws)';
const IMPORT_PATTERNS = [
  // Line-anchored to keep a mid-string `import` from matching.
  [
    'http-client import',
    new RegExp(`^\\s*import\\s+[\\s\\S]*?from\\s+['"]${HTTP_CLIENT_SPECIFIERS}['"]`, 'm'),
  ],
  [
    'http-client dynamic import',
    new RegExp(`\\bimport\\s*\\(\\s*['"]${HTTP_CLIENT_SPECIFIERS}['"]\\s*\\)`, 'm'),
  ],
  [
    'http-client require',
    new RegExp(`\\brequire\\s*\\(\\s*['"]${HTTP_CLIENT_SPECIFIERS}['"]\\s*\\)`, 'm'),
  ],
];

/**
 * Allow-list — paths relative to the repo root. Each entry corresponds
 * to a documented explicit-user-action code path. Add new entries with
 * a comment explaining why (auditable in `git log`).
 */
const ALLOW_LIST = [
  // OTLP HTTP exporter — fires only when the operator wires an OTLP
  // collector URL into the tracer config (Phase 04).
  'packages/observability/src/exporters/otlp-http.ts',
  // Opt-in pricing refresh — never invoked automatically (Phase 04).
  'packages/pricing/src/refresh.ts',
  // OAuth flows — explicit user action; full surface in Phase 03d.
  /^packages\/security\/src\/oauth\//,
  // Skill installer — explicit user action (Phase 03d).
  'packages/security/src/supply-chain/installer.ts',
  // Skill signature verifier — explicit user action; resolves the
  // publisher key over the configured well-known URL (Phase 03d).
  'packages/security/src/supply-chain/signature.ts',
  // Provider adapters — Phase 06 will fill the directory; preemptively
  // allow-list to keep the guard green when Phase 06 lands.
  /^packages\/provider\//,
  // MCP client transports — Phase 09.
  /^packages\/mcp\//,
  // Embedder model downloads — Phase 05.
  /^packages\/embedder-[A-Za-z-]+\//,
  // Storage backends — Phase 05+.
  /^packages\/store-[A-Za-z-]+\//,
];

const PACKAGES_DIR = join(ROOT, 'packages');

async function* walkSrcFiles() {
  const packages = await readdir(PACKAGES_DIR, { withFileTypes: true });
  for (const pkg of packages) {
    if (!pkg.isDirectory()) continue;
    const srcDir = join(PACKAGES_DIR, pkg.name, 'src');
    try {
      await stat(srcDir);
    } catch {
      continue;
    }
    yield* walk(srcDir);
  }
}

async function* walk(root) {
  const entries = await readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(root, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
      continue;
    }
    if (entry.isFile() && (full.endsWith('.ts') || full.endsWith('.mts'))) {
      yield full;
    }
  }
}

function isAllowListed(relativePath) {
  for (const entry of ALLOW_LIST) {
    if (typeof entry === 'string' && entry === relativePath) return true;
    if (entry instanceof RegExp && entry.test(relativePath)) return true;
  }
  return false;
}

function stripComments(source) {
  let out = source;
  // Block comments.
  out = out.replace(/\/\*[\s\S]*?\*\//g, ' ');
  // Line comments.
  out = out.replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
  return out;
}

function stripCommentsAndStrings(source) {
  // Best-effort comment + string stripping. The regex passes are not a
  // full TypeScript parser, but they are sufficient for the patterns
  // we look for (`fetch(...)` etc.) — a real `fetch(` call site never
  // hides inside a comment AND a single-line literal at the same time.
  let out = stripComments(source);
  // Single-quoted strings.
  out = out.replace(/'([^'\\\n]|\\.)*'/g, "''");
  // Double-quoted strings.
  out = out.replace(/"([^"\\\n]|\\.)*"/g, '""');
  // Template literals (best-effort: only single-line ones).
  out = out.replace(/`([^`\\]|\\.)*`/g, '``');
  return out;
}

/**
 * Detect forbidden network primitives in a single source string. Call-site
 * patterns run against comment+string-stripped source; import patterns run
 * against comment-stripped (string-preserving) source. Exported for testing.
 */
export function detectViolations(source) {
  const callSource = stripCommentsAndStrings(source);
  const importSource = stripComments(source);
  const violations = [];
  for (const [label, pattern] of CALL_PATTERNS) {
    if (pattern.test(callSource)) violations.push(label);
  }
  for (const [label, pattern] of IMPORT_PATTERNS) {
    if (pattern.test(importSource)) violations.push(label);
  }
  return violations;
}

async function scanFile(filePath) {
  const relativePath = relative(ROOT, filePath);
  const source = await readFile(filePath, 'utf8');
  return { relativePath, violations: detectViolations(source) };
}

async function main() {
  const offending = [];
  for await (const file of walkSrcFiles()) {
    const { relativePath, violations } = await scanFile(file);
    if (violations.length === 0) continue;
    if (isAllowListed(relativePath)) continue;
    offending.push({ relativePath, violations });
  }

  if (offending.length === 0) {
    console.log('check-no-network: PASS — no implicit network call sites detected.');
    process.exit(0);
  }

  console.error('check-no-network: FAIL');
  console.error('');
  console.error('Implicit network call sites detected outside the allow-list:');
  for (const entry of offending) {
    console.error(`  - ${entry.relativePath}: ${entry.violations.join(', ')}`);
  }
  console.error('');
  console.error('If the call is part of an explicit user-initiated action, add the');
  console.error('file to ALLOW_LIST in scripts/check-no-network.mjs with a comment');
  console.error('explaining why. See SECURITY.md § Privacy & telemetry (DEC-154 / ADR-041).');
  process.exit(1);
}

// Only run the repo scan when executed directly — importing this module
// (e.g. for testing `detectViolations`) must not trigger a full scan.
if (process.argv[1] === __filename) {
  main().catch((err) => {
    console.error('check-no-network: ERROR');
    console.error(err);
    process.exit(2);
  });
}
