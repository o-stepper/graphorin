#!/usr/bin/env node

/**
 * check-api-wording.mjs
 *
 * The public API reference (documentation/api, generated from TSDoc)
 * must describe behaviour, not our internal planning artifacts. An
 * external review found audit-ticket wording ("deep retest P1-3",
 * "W-135", wave ids) leaking into published pages; the docblocks were
 * swept, and this gate keeps them clean: it scans the committed
 * documentation/api markdown for the internal id families and fails on
 * any hit.
 *
 * Real-world names that superficially resemble the families (SHA-256,
 * P-256, UTF-8, RFC numbers, model ids) are NOT matched: every pattern
 * below is anchored to the specific shapes of our ticket vocabularies.
 *
 * Usage:
 *   node scripts/check-api-wording.mjs             # scan documentation/api
 *   node scripts/check-api-wording.mjs --self-test # prove both verdicts
 */

import { execSync } from 'node:child_process';
import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Internal id families that must never appear in public API docs. */
const PATTERNS = [
  {
    name: 'dated audit reference',
    re: /\b(?:deep retest|audit|e2e) 20[0-9]{2}-[0-9]{2}(?:-[0-9]{2})?\b/i,
  },
  { name: 'P#-# finding id', re: /\bP[0-9]-[0-9]+\b/ },
  { name: 'W-### work item', re: /\bW-[0-9]{3}\b/ },
  { name: 'WI-# work item', re: /\bWI-[0-9]+\b/ },
  { name: 'PS/CS/EB/MRET/SOTA id', re: /\b(?:PS|CS|EB|MRET|SOTA)-[0-9]+\b/ },
  // ADR-x / DEC-x are NOT matched: architecture-decision references are
  // an established public convention in the guides (storage.md, tools.md).
  { name: 'MST/MCON/CE/SPL id', re: /\b(?:MST|MCON|CE|SPL)-[0-9]+\b/ },
  {
    name: 'memory-pipeline finding id',
    re: /\bmemory-(?:consolidation|retrieval)-[0-9]{2}\b/,
  },
  { name: 'R-## finding id', re: /\bR-[0-9]{2}\b/ },
  { name: 'wave id', re: /\bwave-[A-E]\b/i },
  {
    name: 'kebab finding id',
    re: /\b(?:workflow|tools|memory|server|secrets|core-[a-z]+)-[0-9]{2}\b/,
  },
  { name: 'screaming-kebab finding id', re: /\b[A-Z]{2,}(?:-[A-Z]+)+-[0-9]{2}\b/ },
];

function scanFile(path, content) {
  const findings = [];
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    for (const { name, re } of PATTERNS) {
      const m = re.exec(lines[i]);
      if (m !== null) {
        findings.push({ path, line: i + 1, name, excerpt: m[0] });
      }
    }
  }
  return findings;
}

function scanApiDocs() {
  const files = execSync("git ls-files 'documentation/api/**/*.md'", {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
    .trim()
    .split('\n')
    .filter((f) => f.length > 0);
  const findings = [];
  for (const rel of files) {
    findings.push(...scanFile(rel, readFileSync(join(ROOT, rel), 'utf8')));
  }
  return { files: files.length, findings };
}

function selfTest() {
  const dir = mkdtempSync(join(tmpdir(), 'api-wording-selftest-'));
  try {
    const dirty = join(dir, 'dirty.md');
    writeFileSync(
      dirty,
      'Fixed in the deep retest 2026-07-19 (P1-3) pass; see W-135 and TOOLS-EX-01.\n',
    );
    const clean = join(dir, 'clean.md');
    writeFileSync(
      clean,
      'Hashes use SHA-256; keys are P-256; text is UTF-8 per RFC 8259. Model: gpt-5.6-sol.\n',
    );
    const dirtyHits = scanFile('dirty.md', readFileSync(dirty, 'utf8'));
    const cleanHits = scanFile('clean.md', readFileSync(clean, 'utf8'));
    if (dirtyHits.length < 3) {
      console.error(
        `[check-api-wording] self-test FAIL: expected >=3 hits on the dirty fixture, got ${dirtyHits.length}`,
      );
      return 1;
    }
    if (cleanHits.length !== 0) {
      console.error(
        `[check-api-wording] self-test FAIL: false positives on real-world names: ${JSON.stringify(cleanHits)}`,
      );
      return 1;
    }
    console.log('[check-api-wording] self-test OK (dirty fixture caught, real-world names pass)');
    return 0;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function main() {
  if (process.argv.includes('--self-test')) {
    process.exit(selfTest());
  }
  const { files, findings } = scanApiDocs();
  if (findings.length > 0) {
    for (const f of findings.slice(0, 50)) {
      console.error(`${f.path}:${f.line}: ${f.name}: "${f.excerpt}"`);
    }
    if (findings.length > 50) console.error(`... and ${findings.length - 50} more`);
    console.error(
      `[check-api-wording] FAIL: ${findings.length} internal audit label(s) in ${files} scanned API doc page(s). ` +
        'Remove the ticket wording from the source TSDoc and regenerate documentation/api.',
    );
    process.exit(1);
  }
  console.log(`[check-api-wording] OK: ${files} API doc page(s), no internal audit labels.`);
}

if (
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) ===
    (() => {
      try {
        return realpathSync(process.argv[1]);
      } catch {
        return process.argv[1];
      }
    })()
) {
  main();
}
