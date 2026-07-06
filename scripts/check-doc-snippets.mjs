#!/usr/bin/env node
/**
 * check-doc-snippets.mjs — DOC-13.
 *
 * Type-checks the `ts` / `typescript` fenced code blocks of the documentation
 * pages listed in {@link CHECKED} against the REAL `@graphorin/*` packages, so a
 * snippet that names a non-existent export / option (DOC-7..11) fails CI instead
 * of shipping as un-typechecked prose.
 *
 * Mechanism: each block is compiled in-memory with the TypeScript compiler API.
 * Modules resolve from the repo root (`@graphorin/*` → each package's built
 * `dist/*.d.ts`), so the packages must be built first — in CI this runs after
 * the workspace build; locally, `pnpm -r build` (or at least the packages a
 * snippet imports) before running.
 *
 * Snippets are expected to be COMPLETE, copy-pasteable programs (with their
 * imports). A block that is deliberately illustrative / partial opts out with a
 * `no-check` token in its info string (e.g. ```ts no-check).
 *
 * Usage:
 *   pnpm run check-doc-snippets
 *
 * Exit codes:
 *   0 — every checked snippet type-checks.
 *   1 — at least one snippet has a type error.
 *   2 — invocation error (missing file, etc.).
 */

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Pages whose `ts` snippets must type-check. An entry is a path (check every
 * `ts` block) or `{ file, includes }` (check only blocks containing `includes`).
 * Coverage grows as each priority guide's snippets are made compilable
 * (DOC-7..11); this is the enforced floor, not the ceiling.
 */
const CHECKED = [
  'documentation/guide/embedders.md',
  'documentation/guide/persistence.md',
  // E10 (docs-06): every compile-verified doc bug of the 2026-07 audit sat on
  // an un-gated page (ctx.fetch, allowedRefs, createLlamaCppNodeAdapter,
  // RRFReranker({k}), client.runAgent). These pages are now enforced;
  // deliberately-partial fragments carry a `ts no-check` info token.
  'documentation/guide/quickstart.md',
  'documentation/guide/tools.md',
  'documentation/guide/secrets.md',
  'documentation/guide/standalone-server.md',
  'documentation/guide/agent-runtime.md',
  // W-057: full-page coverage. Deliberately illustrative fragments and
  // blocks importing packages absent from the workspace (@ai-sdk/* in
  // providers.md) carry a visible `ts no-check` token in the page itself
  // instead of an invisible manifest filter.
  'documentation/guide/memory-system.md',
  'documentation/guide/providers.md',
  'documentation/guide/evals.md',
  'documentation/guide/mcp-client.md',
  'documentation/guide/observability.md',
  'documentation/guide/rerankers.md',
  'documentation/guide/security.md',
  'documentation/guide/sessions.md',
  'documentation/guide/skills.md',
  'documentation/guide/storage.md',
  'documentation/guide/workflow-engine.md',
  'documentation/reference/pricing.md',
];

const COMPILER_OPTIONS = {
  module: ts.ModuleKind.ESNext,
  target: ts.ScriptTarget.ES2022,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  strict: true,
  noEmit: true,
  skipLibCheck: true,
  esModuleInterop: true,
  resolveJsonModule: true,
  types: ['node'],
  lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'],
  // The repo root doesn't depend on the framework packages, so they aren't in
  // root node_modules. Resolve `@graphorin/*` straight to each package's built
  // `dist/*.d.ts` (transitive `@graphorin/*` imports inside those .d.ts files
  // resolve through the same mapping). NOTE: top-level packages only; subpath
  // exports (`@graphorin/security/auth`) need a richer mapping when a checked
  // snippet first imports one.
  baseUrl: ROOT,
  paths: {
    // Subpath exports need their own entry (the `@graphorin/*` glob below maps
    // the package name only). Add one per subpath a checked snippet imports.
    '@graphorin/mcp/client': ['packages/mcp/dist/client'],
    '@graphorin/memory/migration': ['packages/memory/dist/migration'],
    '@graphorin/security/audit': ['packages/security/dist/audit'],
    '@graphorin/security/guardrails': ['packages/security/dist/guardrails'],
    '@graphorin/security/sandbox': ['packages/security/dist/sandbox'],
    '@graphorin/sessions/export': ['packages/sessions/dist/export'],
    '@graphorin/skills/activation': ['packages/skills/dist/activation'],
    '@graphorin/skills/errors': ['packages/skills/dist/errors'],
    '@graphorin/skills/frontmatter': ['packages/skills/dist/frontmatter'],
    '@graphorin/skills/loader': ['packages/skills/dist/loader'],
    '@graphorin/skills/migration': ['packages/skills/dist/migration'],
    '@graphorin/skills/registry': ['packages/skills/dist/registry'],
    '@graphorin/skills/spec': ['packages/skills/dist/spec'],
    '@graphorin/store-sqlite/connection': ['packages/store-sqlite/dist/connection'],
    '@graphorin/tools/code-mode': ['packages/tools/dist/code-mode'],
    '@graphorin/*': ['packages/*/dist'],
    // Third-party deps a snippet may import are not in root node_modules
    // (the repo root does not depend on them); resolve through a package
    // that does.
    zod: ['packages/tools/node_modules/zod'],
  },
};

/**
 * Extract `ts` / `typescript` fenced blocks with their info-string flags.
 * Tokens honoured (W-057):
 *   - `no-check`         - deliberately illustrative/partial; not compiled.
 *   - `file=<name>.ts`   - the block is a named FILE of the page: it is
 *     written into the page's temp dir so sibling blocks can import it
 *     relatively (`./<name>.js` under Bundler resolution). A named block
 *     is still compiled itself unless it also carries `no-check`.
 * Exported for the `--self-test` fixtures.
 */
export function extractTsBlocks(markdown) {
  const blocks = [];
  const fence = /```(ts|typescript)([^\n]*)\n([\s\S]*?)```/g;
  let match;
  let index = 0;
  for (match = fence.exec(markdown); match !== null; match = fence.exec(markdown)) {
    const info = match[2].trim();
    const code = match[3];
    const fileMatch = /\bfile=([\w./-]+)\b/.exec(info);
    blocks.push({
      index,
      code,
      check: !/\bno-check\b/.test(info),
      ...(fileMatch !== null ? { file: fileMatch[1] } : {}),
    });
    index += 1;
  }
  return blocks;
}

/**
 * Compile a single snippet. The snippet is written to a real `.ts` file inside
 * a temp dir AT THE REPO ROOT so the `baseUrl` + the `@graphorin` paths mapping
 * (see COMPILER_OPTIONS) resolve against the real packages, and it is
 * type-checked with a standard program — no synthetic compiler-host module
 * resolution to get wrong. `namedFiles` (W-057) are the page's `file=` blocks,
 * written alongside so relative imports resolve; their own diagnostics are
 * reported when they are the block under check, not here.
 */
function checkSnippet(code, namedFiles = new Map()) {
  const dir = mkdtempSync(join(ROOT, '.doc-snippet-'));
  const file = join(dir, 'snippet.ts');
  try {
    for (const [name, content] of namedFiles) {
      writeFileSync(join(dir, name), content, 'utf8');
    }
    writeFileSync(file, code, 'utf8');
    const program = ts.createProgram([file], COMPILER_OPTIONS);
    return ts.getPreEmitDiagnostics(program).filter((d) => d.file?.fileName === file);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function run() {
  let checked = 0;
  let failed = 0;

  for (const entry of CHECKED) {
    // An entry is either a path (check every `ts` block) or `{ file, includes }`
    // to check only the blocks whose code contains `includes` — for heavy pages
    // where just one snippet is API-bearing and the rest are illustrative.
    const relFile = typeof entry === 'string' ? entry : entry.file;
    const includes = typeof entry === 'string' ? undefined : entry.includes;
    let markdown;
    try {
      markdown = readFileSync(resolve(ROOT, relFile), 'utf8');
    } catch (err) {
      console.error(`[check-doc-snippets] cannot read ${relFile}: ${err.message}`);
      process.exit(2);
    }
    const blocks = extractTsBlocks(markdown);
    // W-057: the page's named blocks are written next to every snippet of
    // the page so relative imports (`./stub.js` -> stub.ts under Bundler
    // resolution) work.
    const namedFiles = new Map(
      blocks.filter((b) => b.file !== undefined).map((b) => [b.file, b.code]),
    );
    for (const block of blocks) {
      if (!block.check) continue;
      if (includes !== undefined && !block.code.includes(includes)) continue;
      checked += 1;
      const diagnostics = checkSnippet(block.code, namedFiles);
      if (diagnostics.length > 0) {
        failed += 1;
        for (const d of diagnostics) {
          const message = ts.flattenDiagnosticMessageText(d.messageText, '\n');
          const where =
            d.file && typeof d.start === 'number'
              ? ` (line ${d.file.getLineAndCharacterOfPosition(d.start).line + 1} of the snippet)`
              : '';
          console.error(`✗ ${relFile} — ts block #${block.index}${where}: ${message}`);
        }
      }
    }
  }

  if (checked === 0) {
    console.error('[check-doc-snippets] no checkable snippets found — manifest empty?');
    process.exit(2);
  }
  console.log(
    `[check-doc-snippets] checked ${checked} snippet(s) across ${CHECKED.length} page(s); ${failed} failed.`,
  );
  process.exit(failed > 0 ? 1 : 0);
}

/**
 * W-057: fixtures for the extraction seam - `no-check`, `file=`, and the
 * multi-file write path. Wired into `check-gates-selftest` (W-073).
 */
function selfTest() {
  let bad = 0;
  const md = [
    'Intro.',
    '```ts',
    'export const a = 1;',
    '```',
    '```ts no-check',
    'partial fragment',
    '```',
    '```ts file=helper.ts',
    "export const helper = 'h';",
    '```',
    '```ts file=skipped.ts no-check',
    "export const skipped: number = 'not checked';",
    '```',
  ].join('\n');
  const blocks = extractTsBlocks(md);
  const cases = [
    ['four blocks extracted', blocks.length === 4],
    ['plain block is checked', blocks[0]?.check === true && blocks[0]?.file === undefined],
    ['no-check block is skipped', blocks[1]?.check === false],
    ['file= block carries its name', blocks[2]?.file === 'helper.ts' && blocks[2]?.check === true],
    [
      'file= + no-check writes but does not check',
      blocks[3]?.file === 'skipped.ts' && blocks[3]?.check === false,
    ],
  ];
  // Multi-file compile: a snippet importing the named helper resolves.
  const named = new Map([['helper.ts', "export const helper: string = 'h';\n"]]);
  const ok = checkSnippet(
    "import { helper } from './helper.js';\nconst x: string = helper;\n",
    named,
  );
  cases.push(['relative import of a named block compiles', ok.length === 0]);
  const bad2 = checkSnippet(
    "import { helper } from './helper.js';\nconst x: number = helper;\n",
    named,
  );
  cases.push(['type error against a named block is caught', bad2.length > 0]);
  for (const [label, pass] of cases) {
    if (!pass) {
      bad += 1;
      console.error(`self-test FAIL [${label}]`);
    }
  }
  console.log(
    bad === 0
      ? `[check-doc-snippets] self-test: ${cases.length}/${cases.length} ok`
      : `[check-doc-snippets] self-test: ${bad} failed`,
  );
  process.exit(bad > 0 ? 1 : 0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--self-test')) selfTest();
  else run();
}
