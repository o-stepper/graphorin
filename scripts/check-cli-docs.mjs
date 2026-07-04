#!/usr/bin/env node
/**
 * check-cli-docs.mjs — DOC-6 (the CI half) / Wave-2 gate "a fake CLI command
 * fails CI", extended by E10 (periphery-20) to flags + positionals + a
 * reverse pass.
 *
 * The CLI guide (documentation/guide/cli.md) drifted from the real command
 * surface — it documented subcommands that don't exist (e.g. `consolidator
 * run`, `pricing show`, `auth logout`), fake flags (`skills install --source
 * npm-package`, `start --storage`), and a positional form of `auth login`
 * that errors. This gate keeps it correct by diffing the docs against the
 * REAL commander tree parsed out of the CLI binary
 * (packages/cli/src/bin/graphorin.ts):
 *
 *   1. NAME level (prose + code): every documented `graphorin <group> <sub>`
 *      must be a real command path.
 *   2. FLAG level (fenced ```bash blocks only): every `--flag` used in a
 *      `graphorin ...` invocation must be declared by that command via
 *      `.option()` / `.requiredOption()` (or be a program-level option).
 *   3. POSITIONAL level (bash blocks): a bare positional argument passed to a
 *      command whose `.command('name')` declaration takes none is a drift
 *      (the `graphorin auth login mcp.example.com` class).
 *   4. REVERSE pass: real commands never mentioned in cli.md are reported as
 *      warnings (they do not fail the gate — some commands are deliberately
 *      table-only).
 *
 * Mechanism: the binary registers commands in per-group `register<X>Commands`
 * functions. Within a block, a `program.command('x')` call is a TOP-LEVEL
 * command and a `<var>.command('x')` call (var !== program) is a SUBCOMMAND of
 * that block's group. Options are attributed to the nearest preceding
 * `.command(...)` in the same block (registration code declares options
 * immediately after the command, chained or via the captured variable).
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

/** `graphorin <group> [<sub>]` references in the docs (prose + code fences). */
const DOC_CMD = /graphorin\s+([a-z][\w-]*)(?:\s+([a-z][\w-]*))?/g;
/** `.command('x ...')` with any receiver; captures receiver + decl string. */
const CMD_DECL = /\b([a-z]\w*)\s*\.command\(\s*'([^']+)'/g;
/** `.option('-x, --flag <v>')` / `.requiredOption(...)`; captures the flags string. */
const OPTION_DECL = /\.(?:requiredOption|option)\(\s*'([^']+)'/g;

/** Extract every long/short flag token from a commander flags string. */
function flagsFrom(decl) {
  return decl.match(/--?[\w-]+/g) ?? [];
}

/**
 * Parse the commander tree from the CLI binary source.
 * @returns {{
 *   topLevel: Set<string>,
 *   groups: Map<string, Set<string>>,
 *   commandMeta: Map<string, { takesArgs: boolean, options: Set<string> }>,
 *   globalOptions: Set<string>,
 * }}
 * `commandMeta` keys are `'group'` or `'group sub'`.
 */
export function parseCommandTree(src) {
  const topLevel = new Set();
  const groups = new Map();
  const commandMeta = new Map();
  const globalOptions = new Set(['--help', '-h', '--version', '-V']);
  // One block per `register<X>Commands` function so a reused receiver var is
  // scoped to its own group.
  const blocks = src.split(/\nfunction\s+register\w+Commands\b/);
  for (const block of blocks) {
    // Segment the block at .command() declarations; the options between one
    // declaration and the next belong to the former.
    const decls = [...block.matchAll(CMD_DECL)].map((m) => ({
      receiver: m[1],
      decl: m[2],
      index: m.index ?? 0,
    }));
    const blockTop = [];
    const subs = [];
    for (const d of decls) {
      const name = d.decl.split(/\s+/)[0];
      if (d.receiver === 'program') {
        blockTop.push({ name, decl: d.decl, index: d.index });
        topLevel.add(name);
      } else {
        subs.push({ name, decl: d.decl, index: d.index });
      }
    }
    // A block with subcommands declares exactly one group (its first — and
    // only — program-rooted command); every var-rooted command is its sub.
    const group = blockTop[0]?.name;
    if (subs.length > 0 && group !== undefined) {
      const set = groups.get(group) ?? new Set();
      for (const s of subs) set.add(s.name);
      groups.set(group, set);
    }
    const all = [...blockTop.map((d) => ({ ...d, key: d.name })), ...subs.map((d) => ({ ...d, key: group !== undefined ? `${group} ${d.name}` : d.name }))].sort(
      (a, b) => a.index - b.index,
    );
    for (let i = 0; i < all.length; i++) {
      const d = all[i];
      const end = all[i + 1]?.index ?? block.length;
      const span = block.slice(d.index, end);
      const options = new Set();
      for (const m of span.matchAll(OPTION_DECL)) {
        for (const f of flagsFrom(m[1])) options.add(f);
      }
      const takesArgs = /[<[]/.test(d.decl);
      const prev = commandMeta.get(d.key);
      if (prev === undefined) {
        commandMeta.set(d.key, { takesArgs, options });
      } else {
        for (const f of options) prev.options.add(f);
        if (takesArgs) prev.takesArgs = true;
      }
    }
  }
  return { topLevel, groups, commandMeta, globalOptions };
}

/** Extract `{ group, sub }` command paths documented in cli.md. */
export function parseDocumentedCommands(md) {
  const out = [];
  for (const m of md.matchAll(DOC_CMD)) {
    out.push({ group: m[1], sub: m[2] });
  }
  return out;
}

/**
 * Extract `graphorin ...` invocations from fenced ```bash blocks (joining
 * trailing-backslash continuations). Returns token arrays (without the
 * leading `graphorin`).
 */
export function parseBashInvocations(md) {
  const out = [];
  const fence = /```(?:bash|sh|shell)[^\n]*\n([\s\S]*?)```/g;
  for (const m of md.matchAll(fence)) {
    const joined = m[1].replace(/\\\n\s*/g, ' ');
    for (const rawLine of joined.split('\n')) {
      // Strip prompts and trailing `# comments` before tokenizing.
      const line = rawLine
        .replace(/^\s*\$\s+/, '')
        .replace(/\s+#.*$/, '')
        .trim();
      if (line.startsWith('#')) continue;
      const at = line.indexOf('graphorin ');
      if (at === -1) continue;
      const tokens = line
        .slice(at + 'graphorin '.length)
        .split(/\s+/)
        .filter((t) => t.length > 0);
      if (tokens.length > 0) out.push(tokens);
    }
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

/**
 * Flag + positional check over bash invocations (periphery-20). Only checks
 * commands the tree actually knows, so prose-level drift stays the job of
 * {@link diffCommands}.
 * @returns {string[]}
 */
export function diffInvocations(tree, invocations) {
  const violations = new Set();
  for (const tokens of invocations) {
    const group = tokens[0];
    if (group === undefined || !tree.topLevel.has(group)) continue; // name-level pass owns this
    const subs = tree.groups.get(group);
    const hasSub = subs !== undefined && tokens[1] !== undefined && subs.has(tokens[1]);
    const key = hasSub ? `${group} ${tokens[1]}` : group;
    const meta = tree.commandMeta.get(key);
    if (meta === undefined) continue;
    const rest = tokens.slice(hasSub ? 2 : 1);
    const label = `graphorin ${key}`;
    // Flags: every documented --flag must exist on the command (or globally).
    for (const t of rest) {
      if (!t.startsWith('-')) continue;
      const flag = t.split('=')[0];
      if (!/^--?[\w-]+$/.test(flag)) continue;
      if (meta.options.has(flag) || tree.globalOptions.has(flag)) continue;
      const known = [...meta.options].filter((f) => f.startsWith('--')).sort().join(' ');
      violations.add(
        `'${label} ${flag}' — flag not declared by the command (real: ${known.length > 0 ? known : '<none>'})`,
      );
    }
    // Positional: a bare first argument against a command that declares none
    // (the `auth login mcp.example.com` class). Conservative: only the first
    // token, only when no flag precedes it (a value after a flag is fine).
    const first = rest[0];
    if (
      first !== undefined &&
      !first.startsWith('-') &&
      !first.startsWith('<') &&
      !first.startsWith('[') &&
      !meta.takesArgs
    ) {
      violations.add(
        `'${label} ${first}' — '${key}' declares no positional arguments (did the docs mean a flag?)`,
      );
    }
  }
  return [...violations];
}

/**
 * Reverse pass: real command paths never mentioned in cli.md. Warnings only.
 * @returns {string[]}
 */
export function undocumentedCommands(tree, documented) {
  const seen = new Set();
  for (const { group, sub } of documented) {
    seen.add(group);
    if (sub !== undefined) seen.add(`${group} ${sub}`);
  }
  const missing = [];
  for (const group of tree.topLevel) {
    if (!seen.has(group)) missing.push(group);
    for (const sub of tree.groups.get(group) ?? []) {
      if (!seen.has(`${group} ${sub}`)) missing.push(`${group} ${sub}`);
    }
  }
  return missing.sort();
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
  const invocations = parseBashInvocations(md);
  const violations = [...diffCommands(tree, documented), ...diffInvocations(tree, invocations)];
  for (const v of violations) console.error(`✗ ${v}`);
  const missing = undocumentedCommands(tree, documented);
  for (const m of missing) {
    console.warn(`! undocumented real command: 'graphorin ${m}' (warning only)`);
  }
  console.log(
    `[check-cli-docs] checked ${documented.length} documented reference(s) + ${invocations.length} bash invocation(s) against ${tree.topLevel.size} real commands; ${violations.length} drift(s), ${missing.length} undocumented (warn).`,
  );
  process.exit(violations.length > 0 ? 1 : 0);
}

/** Exercise the failure paths against in-memory fixtures. */
function selfTest() {
  const src = `
function registerConsolidatorCommands(program) {
  const c = program.command('consolidator');
  c.command('status').option('--json', 'machine output');
  c.command('set-tier <tier>');
  c.command('stop');
}
function registerAuthCommands(program) {
  const a = program.command('auth');
  a.command('login')
    .requiredOption('--server <url>', 'server URL')
    .option('--device-flow', 'use the device flow');
}
function registerLifecycleCommands(program) {
  program.command('start').option('-c, --config <path>', 'config file');
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
  const invocationCases = [
    {
      label: 'real flag passes',
      md: '```bash\ngraphorin auth login --server https://x --device-flow\n```',
      want: 0,
    },
    {
      label: 'fake flag fails',
      md: '```bash\ngraphorin start --storage ./x.db\n```',
      want: 1,
    },
    {
      label: 'bare positional on arg-less command fails',
      md: '```bash\ngraphorin auth login mcp.example.com\n```',
      want: 1,
    },
    {
      label: 'positional on arg-taking command passes',
      md: '```bash\ngraphorin consolidator set-tier standard\n```',
      want: 0,
    },
    {
      label: 'continuation lines are joined',
      md: '```bash\ngraphorin auth login \\\n  --server https://x\n```',
      want: 0,
    },
    {
      label: 'prose flags are NOT flag-checked',
      md: 'run graphorin start --storage in prose',
      want: 0,
    },
  ];
  for (const c of invocationCases) {
    const got = diffInvocations(tree, parseBashInvocations(c.md)).length;
    if (got !== c.want) {
      bad += 1;
      console.error(`✗ self-test [${c.label}] — expected ${c.want} drift(s), got ${got}`);
    }
  }
  // Sanity: parser recorded the group + subs + per-command options.
  if (!tree.groups.get('consolidator')?.has('set-tier')) {
    bad += 1;
    console.error('✗ self-test — parser did not record consolidator/set-tier');
  }
  if (!tree.commandMeta.get('auth login')?.options.has('--server')) {
    bad += 1;
    console.error('✗ self-test — parser did not attribute --server to auth login');
  }
  const undocumented = undocumentedCommands(tree, parseDocumentedCommands('graphorin start'));
  if (!undocumented.includes('consolidator stop')) {
    bad += 1;
    console.error('✗ self-test — reverse pass missed consolidator stop');
  }
  const total = cases.length + invocationCases.length + 3;
  console.log(
    bad === 0
      ? `[check-cli-docs] self-test: ${total}/${total} ok`
      : `[check-cli-docs] self-test: ${bad} failed`,
  );
  process.exit(bad > 0 ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv.includes('--self-test')) selfTest();
  else await run();
}
