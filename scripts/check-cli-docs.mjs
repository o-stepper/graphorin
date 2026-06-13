#!/usr/bin/env node
/**
 * check-cli-docs.mjs — DOC-6 (the CI half) / Wave-2 gate "a fake CLI command
 * fails CI".
 *
 * The CLI guide (documentation/guide/cli.md) drifted from the real command
 * surface — it documented subcommands that don't exist (e.g. `consolidator
 * run`, `pricing show`, `auth logout`). DOC-6 corrected the prose; this gate
 * keeps it correct by diffing every documented `graphorin <group> <sub>`
 * against the REAL commander tree parsed out of the CLI binary
 * (packages/cli/src/bin/graphorin.ts).
 *
 * Mechanism: the binary registers commands in per-group `register<X>Commands`
 * functions. Within a block, a `program.command('x')` call is a TOP-LEVEL
 * command and a `<var>.command('x')` call (var !== program) is a SUBCOMMAND of
 * that block's group. Parsing per-block keeps a reused var (e.g. `t` for
 * triggers / traces / telemetry) correctly scoped.
 *
 * A documented command whose group doesn't exist, or whose subcommand isn't a
 * real subcommand of that group, fails the gate. Tokens after the subcommand
 * (arguments like `<id>`, `./session.jsonl`, flags) are ignored; a top-level
 * command that takes arguments rather than subcommands (e.g. `migrate-export`)
 * has no subcommand set and its second token is treated as an argument.
 *
 * Usage:
 *   pnpm run check-cli-docs
 *   node scripts/check-cli-docs.mjs --self-test
 *
 * Exit codes: 0 ok · 1 drift · 2 invocation error.
 */

import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BIN = join(ROOT, 'packages/cli/src/bin/graphorin.ts');
const DOC = join(ROOT, 'documentation/guide/cli.md');

/** `program.command('x')` — a top-level command (group or argument-taking). */
const PROGRAM_CMD = /\bprogram\s*\.command\(\s*'([a-z][\w-]*)/g;
/** `<var>.command('x')` — captures the receiver var + the command token. */
const ANY_CMD = /\b([a-z]\w*)\s*\.command\(\s*'([a-z][\w-]*)/g;
/** `graphorin <group> [<sub>]` references in the docs (prose + code fences). */
const DOC_CMD = /graphorin\s+([a-z][\w-]*)(?:\s+([a-z][\w-]*))?/g;

/**
 * Parse the commander tree from the CLI binary source.
 * @returns {{ topLevel: Set<string>, groups: Map<string, Set<string>> }}
 */
export function parseCommandTree(src) {
  const topLevel = new Set();
  const groups = new Map();
  // One block per `register<X>Commands` function so a reused receiver var is
  // scoped to its own group.
  const blocks = src.split(/\nfunction\s+register\w+Commands\b/);
  for (const block of blocks) {
    const blockTop = [];
    for (const m of block.matchAll(PROGRAM_CMD)) {
      blockTop.push(m[1]);
      topLevel.add(m[1]);
    }
    const subs = [];
    for (const m of block.matchAll(ANY_CMD)) {
      if (m[1] === 'program') continue; // counted as top-level above
      subs.push(m[2]);
    }
    // A block with subcommands declares exactly one group (its first — and
    // only — program-rooted command); every var-rooted command is its sub.
    if (subs.length > 0 && blockTop.length > 0) {
      const group = blockTop[0];
      const set = groups.get(group) ?? new Set();
      for (const s of subs) set.add(s);
      groups.set(group, set);
    }
  }
  return { topLevel, groups };
}

/** Extract `{ group, sub }` command paths documented in cli.md. */
export function parseDocumentedCommands(md) {
  const out = [];
  for (const m of md.matchAll(DOC_CMD)) {
    out.push({ group: m[1], sub: m[2] });
  }
  return out;
}

/** @returns {string[]} de-duplicated violation messages (empty when clean). */
export function diffCommands(tree, documented) {
  const violations = new Set();
  for (const { group, sub } of documented) {
    if (!tree.topLevel.has(group)) {
      violations.add(`'graphorin ${group}' is not a real command`);
      continue;
    }
    if (sub === undefined) continue;
    const subs = tree.groups.get(group);
    if (subs === undefined) continue; // group takes arguments, not subcommands
    if (!subs.has(sub)) {
      const known = [...subs].sort().join(' / ');
      violations.add(
        `'graphorin ${group} ${sub}' — '${sub}' is not a subcommand of '${group}' (real: ${known})`,
      );
    }
  }
  return [...violations];
}

async function run() {
  let src;
  let md;
  try {
    src = await readFile(BIN, 'utf8');
    md = await readFile(DOC, 'utf8');
  } catch (err) {
    console.error(`[check-cli-docs] cannot read inputs: ${err.message}`);
    process.exit(2);
  }
  const tree = parseCommandTree(src);
  if (tree.topLevel.size === 0) {
    console.error(
      '[check-cli-docs] parsed zero commands from the CLI binary — parser/source drift?',
    );
    process.exit(2);
  }
  const documented = parseDocumentedCommands(md);
  const violations = diffCommands(tree, documented);
  for (const v of violations) console.error(`✗ ${v}`);
  console.log(
    `[check-cli-docs] checked ${documented.length} documented command reference(s) against ${tree.topLevel.size} real commands; ${violations.length} drift(s).`,
  );
  process.exit(violations.length > 0 ? 1 : 0);
}

/** Exercise the failure paths against in-memory fixtures. */
function selfTest() {
  const src = `
function registerConsolidatorCommands(program) {
  const c = program.command('consolidator');
  c.command('status');
  c.command('set-tier <tier>');
  c.command('stop');
}
function registerLifecycleCommands(program) {
  program.command('start');
  program.command('migrate-export <input>');
}
`;
  const tree = parseCommandTree(src);
  const cases = [
    { label: 'real subcommand passes', md: 'graphorin consolidator status', want: 0 },
    { label: 'fake subcommand fails', md: 'graphorin consolidator run', want: 1 },
    { label: 'fake group fails', md: 'graphorin nonsense thing', want: 1 },
    {
      label: 'argument after non-group command ignored',
      md: 'graphorin migrate-export ./x.jsonl',
      want: 0,
    },
    { label: 'top-level command passes', md: 'graphorin start --config foo', want: 0 },
  ];
  let bad = 0;
  for (const c of cases) {
    const got = diffCommands(tree, parseDocumentedCommands(c.md)).length;
    if (got !== c.want) {
      bad += 1;
      console.error(`✗ self-test [${c.label}] — expected ${c.want} drift(s), got ${got}`);
    }
  }
  // Sanity: the fixture parsed the group + its subs.
  if (!tree.groups.get('consolidator')?.has('set-tier')) {
    bad += 1;
    console.error('✗ self-test — parser did not record consolidator/set-tier');
  }
  console.log(
    bad === 0
      ? `[check-cli-docs] self-test: ${cases.length + 1}/${cases.length + 1} ok`
      : `[check-cli-docs] self-test: ${bad} failed`,
  );
  process.exit(bad > 0 ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv.includes('--self-test')) selfTest();
  else await run();
}
