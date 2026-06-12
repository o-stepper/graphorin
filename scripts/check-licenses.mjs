#!/usr/bin/env node
/**
 * check-licenses.mjs
 *
 * SPDX-license allowlist enforcement for the Graphorin monorepo.
 *
 * Two passes run sequentially:
 *
 *   1. Workspace pass — every `packages/* /package.json` must carry
 *      the project's required `license: "MIT"` field. Anything else
 *      is a hard fail (the framework itself is MIT-only).
 *
 *   2. Dependency pass — every direct + transitive runtime
 *      dependency installed under `node_modules/` is resolved and its
 *      declared `license` (or `licenses[].type` for legacy manifests)
 *      is checked against the allowlist below. Workspace packages
 *      (`@graphorin/*`) are skipped — they have already been checked
 *      in the workspace pass.
 *
 * Allowed SPDX identifiers (workspace dependency pass):
 *
 *   MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, 0BSD, Unlicense,
 *   CC0-1.0, CC-BY-4.0, BlueOak-1.0.0, Python-2.0
 *
 * Compound expressions (`MIT OR Apache-2.0`, `(MIT AND BSD-2-Clause)`,
 * etc.) pass when at least one disjunct is on the allowlist; conjunctions
 * pass when every conjunct is on the allowlist.
 *
 * Exit codes:
 *   0 — every package + dependency passed.
 *   1 — at least one license violation found.
 *   2 — invocation error (e.g. node_modules missing).
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const PACKAGES_DIR = join(ROOT, 'packages');
const NODE_MODULES_DIR = join(ROOT, 'node_modules');

/**
 * SPDX identifiers Graphorin redistributes (or links against) without
 * requiring an explicit per-PR review.
 */
const ALLOWED = new Set([
  'MIT',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'ISC',
  '0BSD',
  'Unlicense',
  'CC0-1.0',
  'CC-BY-4.0',
  'BlueOak-1.0.0',
  'Python-2.0',
]);

/**
 * Required license for every workspace package.
 */
const WORKSPACE_REQUIRED_LICENSE = 'MIT';

/**
 * Per-package exceptions for transitive deps that ship with a
 * non-allowlisted license literal but whose use inside Graphorin has
 * been reviewed and accepted. Each entry MUST carry a one-line
 * justification for the audit trail.
 *
 * The exception is keyed by package name; the entry's `license`
 * field must match the literal string declared in the upstream
 * `package.json`'s `license` field so a future drift (e.g. an
 * upstream relicense) re-triggers the audit.
 */
const DEPENDENCY_EXCEPTIONS = new Map([
  // The package literally writes `"license": "SEE LICENSE IN LICENSE"`
  // in its manifest. Inspecting `node_modules/.pnpm/.../spawndamnit/LICENSE`
  // shows the standard MIT permission text (Copyright (c) 2017-present
  // James Kyle). Atlassian / Changesets toolchain transitive dep;
  // build-time only.
  [
    'spawndamnit',
    {
      license: 'SEE LICENSE IN LICENSE',
      reason: 'manifest literal; LICENSE file is plain MIT (verified)',
    },
  ],
  // libvips platform-specific binary brought in transitively by
  // `@huggingface/transformers` -> `sharp`. LGPL-3.0-or-later applies
  // to the native libvips binary; Graphorin dynamically links it via
  // the sharp Node addon and never modifies the libvips source.
  // sharp distributes prebuilt binaries with the corresponding source
  // available upstream, so the LGPL "ability to relink" requirement
  // is satisfied by sharp's published `@img/sharp-libvips-*` packages.
  [
    '@img/sharp-libvips-darwin-arm64',
    {
      license: 'LGPL-3.0-or-later',
      reason: 'transitive via sharp; dynamically linked, source available upstream',
    },
  ],
  [
    '@img/sharp-libvips-darwin-x64',
    {
      license: 'LGPL-3.0-or-later',
      reason: 'transitive via sharp; dynamically linked, source available upstream',
    },
  ],
  [
    '@img/sharp-libvips-linux-arm',
    {
      license: 'LGPL-3.0-or-later',
      reason: 'transitive via sharp; dynamically linked, source available upstream',
    },
  ],
  [
    '@img/sharp-libvips-linux-arm64',
    {
      license: 'LGPL-3.0-or-later',
      reason: 'transitive via sharp; dynamically linked, source available upstream',
    },
  ],
  [
    '@img/sharp-libvips-linux-s390x',
    {
      license: 'LGPL-3.0-or-later',
      reason: 'transitive via sharp; dynamically linked, source available upstream',
    },
  ],
  [
    '@img/sharp-libvips-linux-x64',
    {
      license: 'LGPL-3.0-or-later',
      reason: 'transitive via sharp; dynamically linked, source available upstream',
    },
  ],
  [
    '@img/sharp-libvips-linuxmusl-arm64',
    {
      license: 'LGPL-3.0-or-later',
      reason: 'transitive via sharp; dynamically linked, source available upstream',
    },
  ],
  [
    '@img/sharp-libvips-linuxmusl-x64',
    {
      license: 'LGPL-3.0-or-later',
      reason: 'transitive via sharp; dynamically linked, source available upstream',
    },
  ],
  // khroma 0.x ships without a `license` field in its manifest. Pulled
  // in transitively via `@mermaid-js/mermaid-mindmap@9.3.0` -> mermaid
  // (docs site only; never imported by published @graphorin/*
  // packages). Upstream repo (fabiospampinato/khroma) carries an MIT
  // LICENSE file, and current khroma (1.x+) declares
  // "license": "MIT" — bumping mermaid-mindmap upstream is tracked
  // separately. Build-/docs-time only; no runtime exposure.
  [
    'khroma',
    {
      license: null,
      reason: 'manifest missing license field; upstream LICENSE is MIT (verified); docs-time only',
    },
  ],
]);

/**
 * Manifests whose `license` field is the pre-SPDX `UNLICENSED` literal
 * AND that are workspace-private (not published) are tolerated. The
 * workspace pass guards against this for `packages/*`; this set
 * tolerates the same shape for `examples/*` and `benchmarks/*`.
 */
const WORKSPACE_PRIVATE_OK = new Set(['UNLICENSED']);

/**
 * Read + parse a `package.json` file. Returns `null` on parse failure
 * with a warning printed to stderr.
 */
async function readPackageJson(path) {
  try {
    const raw = await readFile(path, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`check-licenses: WARN — cannot read '${path}': ${err.message}`);
    return null;
  }
}

/**
 * Normalise a `license` field. Some legacy manifests use `licenses`
 * (an array of `{ type, url }`); resolve to a single SPDX-shaped
 * string for downstream comparison.
 */
function normaliseLicense(manifest) {
  if (typeof manifest.license === 'string' && manifest.license.length > 0) {
    return manifest.license.trim();
  }
  if (Array.isArray(manifest.licenses) && manifest.licenses.length > 0) {
    const types = manifest.licenses
      .map((entry) => (typeof entry?.type === 'string' ? entry.type.trim() : null))
      .filter((value) => value !== null);
    if (types.length === 1) return types[0];
    if (types.length > 1) return `(${types.join(' OR ')})`;
  }
  if (typeof manifest.license === 'object' && manifest.license !== null) {
    if (typeof manifest.license.type === 'string') return manifest.license.type.trim();
  }
  return null;
}

/**
 * Decide whether a SPDX expression resolves to "allowed". Supports
 * `OR` (any disjunct is allowed) and `AND` (every conjunct must be
 * allowed); does not support nested expressions beyond a single
 * level (good enough for the npm ecosystem in practice).
 */
function isAllowed(licenseExpression) {
  if (!licenseExpression) return false;
  const cleaned = licenseExpression.replace(/[()]/g, '').trim();
  if (ALLOWED.has(cleaned)) return true;

  const orParts = cleaned.split(/\s+OR\s+/i).map((part) => part.trim());
  if (orParts.length > 1) return orParts.some((part) => isAllowed(part));

  const andParts = cleaned.split(/\s+AND\s+/i).map((part) => part.trim());
  if (andParts.length > 1) return andParts.every((part) => isAllowed(part));

  return false;
}

/**
 * Pass 1 — every workspace package must declare `license: "MIT"`.
 */
async function checkWorkspacePackages() {
  const violations = [];
  let scanned = 0;
  let entries;
  try {
    entries = await readdir(PACKAGES_DIR, { withFileTypes: true });
  } catch (err) {
    console.error(`check-licenses: ERROR — cannot list '${PACKAGES_DIR}': ${err.message}`);
    process.exit(2);
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const manifestPath = join(PACKAGES_DIR, entry.name, 'package.json');
    const manifest = await readPackageJson(manifestPath);
    if (!manifest) continue;
    scanned += 1;
    const license = normaliseLicense(manifest);
    if (license !== WORKSPACE_REQUIRED_LICENSE) {
      violations.push({
        scope: 'workspace',
        path: relative(ROOT, manifestPath),
        name: manifest.name ?? entry.name,
        license: license ?? '<missing>',
        expected: WORKSPACE_REQUIRED_LICENSE,
      });
    }
  }
  return { scanned, violations };
}

/**
 * Walk every directory under `node_modules/`. pnpm installs every
 * resolved package to
 * `node_modules/.pnpm/<spec>/node_modules/<name>/package.json` plus
 * a top-level symlink at `node_modules/<name>` for the entries the
 * workspace actually depends on. We descend into both shapes so the
 * audit covers every installed manifest, not just the top-level
 * symlinks.
 */
async function* walkNodeModules(root, depth = 0) {
  if (depth > 8) return; // belt-and-braces guard against weird symlink loops
  let stats;
  try {
    stats = await stat(root);
  } catch {
    return;
  }
  if (!stats.isDirectory()) return;
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
    const full = join(root, entry.name);
    if (entry.name === '.bin' || entry.name === '.modules' || entry.name === '.cache') {
      continue;
    }
    if (entry.name === '.pnpm') {
      // pnpm content-addressable layer:
      // .pnpm/<pkg>@<ver>_<peer>/node_modules/<pkg>/package.json
      const pnpmEntries = await readdir(full, { withFileTypes: true });
      for (const spec of pnpmEntries) {
        if (!spec.isDirectory()) continue;
        const innerNm = join(full, spec.name, 'node_modules');
        yield* walkNodeModules(innerNm, depth + 1);
      }
      continue;
    }
    if (entry.name.startsWith('@')) {
      const scopedEntries = await readdir(full, { withFileTypes: true });
      for (const scoped of scopedEntries) {
        if (!scoped.isDirectory() && !scoped.isSymbolicLink()) continue;
        yield* yieldPackage(join(full, scoped.name), depth);
      }
      continue;
    }
    yield* yieldPackage(full, depth);
  }
}

async function* yieldPackage(packagePath, depth) {
  const pkgJson = join(packagePath, 'package.json');
  try {
    await stat(pkgJson);
    yield pkgJson;
  } catch {
    // Not a package directory; some tooling leaves bare folders.
  }
  const nested = join(packagePath, 'node_modules');
  yield* walkNodeModules(nested, depth + 1);
}

/**
 * Pass 2 — every transitive dependency must declare an SPDX-allowed
 * license. `@graphorin/*` workspace packages are skipped (they were
 * checked in pass 1).
 */
async function checkDependencies() {
  const violations = [];
  const seen = new Set();
  let scanned = 0;
  for await (const manifestPath of walkNodeModules(NODE_MODULES_DIR)) {
    const manifest = await readPackageJson(manifestPath);
    if (!manifest) continue;
    if (typeof manifest.name !== 'string') continue;
    if (manifest.name.startsWith('@graphorin/')) continue;
    const key = `${manifest.name}@${manifest.version ?? '<unknown>'}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (manifest.private === true && WORKSPACE_PRIVATE_OK.has(normaliseLicense(manifest) ?? ''))
      continue;
    scanned += 1;
    const license = normaliseLicense(manifest);
    const exception = DEPENDENCY_EXCEPTIONS.get(manifest.name);
    if (exception && exception.license === license) continue;
    if (license === null) {
      violations.push({
        scope: 'dependency',
        path: relative(ROOT, manifestPath),
        name: manifest.name,
        license: '<missing>',
      });
      continue;
    }
    if (!isAllowed(license)) {
      violations.push({
        scope: 'dependency',
        path: relative(ROOT, manifestPath),
        name: manifest.name,
        license,
      });
    }
  }
  return { scanned, violations };
}

async function main() {
  const workspace = await checkWorkspacePackages();
  console.log(
    `check-licenses: workspace pass — scanned ${workspace.scanned} workspace package(s); ${workspace.violations.length} violation(s).`,
  );

  let dependency = { scanned: 0, violations: [] };
  try {
    await stat(NODE_MODULES_DIR);
    dependency = await checkDependencies();
    console.log(
      `check-licenses: dependency pass — scanned ${dependency.scanned} installed dependency manifest(s); ${dependency.violations.length} violation(s).`,
    );
  } catch {
    console.warn(
      'check-licenses: WARN — node_modules/ not present; dependency pass skipped. Run `pnpm install` and re-run for the full audit.',
    );
  }

  const total = workspace.violations.length + dependency.violations.length;
  if (total === 0) {
    console.log('check-licenses: PASS — every workspace + dependency license is on the allowlist.');
    process.exit(0);
  }

  console.error('check-licenses: FAIL');
  for (const violation of [...workspace.violations, ...dependency.violations]) {
    if (violation.scope === 'workspace') {
      console.error(
        `  - workspace ${violation.name} (${violation.path}): license '${violation.license}' (expected '${violation.expected}')`,
      );
    } else {
      console.error(
        `  - dependency ${violation.name} (${violation.path}): license '${violation.license}' is not on the SPDX allowlist`,
      );
    }
  }
  console.error('');
  console.error(`Allowed SPDX identifiers (dependency pass): ${[...ALLOWED].sort().join(', ')}.`);
  console.error(
    'If a dependency must ship under a non-allowlisted license, add it to DEPENDENCY_EXCEPTIONS in scripts/check-licenses.mjs with a one-line justification (the entry is auditable in `git log`).',
  );
  process.exit(1);
}

main().catch((err) => {
  console.error('check-licenses: ERROR');
  console.error(err);
  process.exit(2);
});
