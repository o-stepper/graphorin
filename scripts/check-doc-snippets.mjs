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
  // Many illustrative fragments; check the API-bearing snippets.
  { file: 'documentation/guide/memory-system.md', includes: 'migrateEmbedder(' },
  { file: 'documentation/guide/memory-system.md', includes: 'RRFReranker(' },
  // Check the token-counter + llama.cpp snippets (the vercel block imports
  // @ai-sdk/* which is not installed in this workspace; the rest reference
  // external context).
  { file: 'documentation/guide/providers.md', includes: 'setGlobalTokenCounter' },
  { file: 'documentation/guide/providers.md', includes: 'llamaCppNodeAdapter' },
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
    '@graphorin/memory/migration': ['packages/memory/dist/migration'],
    '@graphorin/security/guardrails': ['packages/security/dist/guardrails'],
    '@graphorin/security/sandbox': ['packages/security/dist/sandbox'],
    '@graphorin/tools/code-mode': ['packages/tools/dist/code-mode'],
    '@graphorin/*': ['packages/*/dist'],
    // Third-party deps a snippet may import are not in root node_modules
    // (the repo root does not depend on them); resolve through a package
    // that does.
    zod: ['packages/tools/node_modules/zod'],
  },
};

/** Extract `ts` / `typescript` fenced blocks; honour a `no-check` opt-out token. */
function extractTsBlocks(markdown) {
  const blocks = [];
  const fence = /```(ts|typescript)([^\n]*)\n([\s\S]*?)```/g;
  let match;
  let index = 0;
  for (match = fence.exec(markdown); match !== null; match = fence.exec(markdown)) {
    const info = match[2].trim();
    const code = match[3];
    if (/\bno-check\b/.test(info)) {
      index += 1;
      continue;
    }
    blocks.push({ index, code });
    index += 1;
  }
  return blocks;
}

/**
 * Compile a single snippet. The snippet is written to a real `.ts` file inside
 * a temp dir AT THE REPO ROOT so the `baseUrl` + the `@graphorin` paths mapping
 * (see COMPILER_OPTIONS) resolve against the real packages, and it is
 * type-checked with a standard program — no synthetic compiler-host module
 * resolution to get wrong.
 */
function checkSnippet(code) {
  const dir = mkdtempSync(join(ROOT, '.doc-snippet-'));
  const file = join(dir, 'snippet.ts');
  try {
    writeFileSync(file, code, 'utf8');
    const program = ts.createProgram([file], COMPILER_OPTIONS);
    return ts.getPreEmitDiagnostics(program).filter((d) => d.file?.fileName === file);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

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
  for (const block of extractTsBlocks(markdown)) {
    if (includes !== undefined && !block.code.includes(includes)) continue;
    checked += 1;
    const diagnostics = checkSnippet(block.code);
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
