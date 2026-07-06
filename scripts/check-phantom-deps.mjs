#!/usr/bin/env node
/**
 * check-phantom-deps.mjs - the phantom-dependency gate (W-050).
 *
 * Two invariants over every packages/*\/package.json:
 *
 *   1. Every `@graphorin/*` entry in `dependencies` is actually
 *      imported somewhere under the package's `src/`; entries in
 *      `devDependencies` may be imported under `src/` or `tests/`.
 *      A workspace edge nobody imports ("phantom") lies about the
 *      dependency graph and bloats every downstream install.
 *   2. Every `@graphorin/*` name listed in the package's
 *      tsdown.config.ts `external` array is declared in the manifest
 *      (`dependencies` or `peerDependencies`). An external entry
 *      without a declaration means a future import would bundle-skip
 *      cleanly while the manifest stays silent - exactly the drift
 *      this gate exists to stop.
 *
 * Import detection is textual: `from '…'`, bare `import '…'`,
 * `import('…')` and `require('…')` specifiers, including subpaths
 * (`@graphorin/memory/session`). Doc-comment mentions in backticks do
 * NOT count as imports; a fenced @example containing a real import
 * line would (accepted limitation - such an example documents an
 * intentional coupling anyway).
 *
 * Deliberate structural/type-only edges go in EXCEPTIONS below, each
 * with a reason.
 *
 * Exit codes: 0 ok · 1 violations found.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PACKAGES_DIR = join(ROOT, 'packages');

/**
 * Deliberate exceptions: edges that are declared without a matching
 * import on purpose. Keep each entry justified - an empty list is the
 * healthy state.
 *
 * @type {ReadonlyArray<{ pkg: string; dep: string; reason: string }>}
 */
const EXCEPTIONS = [
  {
    pkg: '@graphorin/cli',
    dep: '@graphorin/store-sqlite-encrypted',
    reason:
      'Real runtime edge the textual scan cannot see: storage.ts loads the ' +
      'optional sub-pack through a computed dynamic import (const moduleName = ' +
      "'@graphorin/store-sqlite-encrypted'; await import(moduleName)) so the CLI " +
      'typechecks without it installed. The devDependency keeps the sub-pack in ' +
      'the workspace for the storage encrypt/rekey tests.',
  },
];

const SOURCE_EXTENSIONS = /\.(?:ts|tsx|mts|cts|js|mjs|cjs)$/;

/**
 * Matches the package name in real import specifiers only:
 * `from '@graphorin/x'`, bare `import '@graphorin/x'`,
 * `import('@graphorin/x')`, `require('@graphorin/x')` - subpath
 * suffixes allowed.
 */
const IMPORT_SPECIFIER_RE =
  /(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)['"](@graphorin\/[a-z0-9_-]+)(?:\/[^'"]*)?['"]/g;

/** Quoted `@graphorin/*` names inside a tsdown config. */
const TSDOWN_NAME_RE = /['"](@graphorin\/[a-z0-9_-]+)['"]/g;

/** Recursively list source files under `dir` (missing dir → []). */
function listSourceFiles(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      files.push(...listSourceFiles(full));
    } else if (SOURCE_EXTENSIONS.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

/** Collect the set of `@graphorin/*` package names imported under `dirs`. */
export function collectImportedNames(dirs) {
  const names = new Set();
  for (const dir of dirs) {
    for (const file of listSourceFiles(dir)) {
      const text = readFileSync(file, 'utf8');
      for (const match of text.matchAll(IMPORT_SPECIFIER_RE)) {
        names.add(match[1]);
      }
    }
  }
  return names;
}

/** Collect the `@graphorin/*` names quoted in a tsdown config (missing file → []). */
export function collectTsdownExternalNames(configPath) {
  let text;
  try {
    text = readFileSync(configPath, 'utf8');
  } catch {
    return new Set();
  }
  const names = new Set();
  for (const match of text.matchAll(TSDOWN_NAME_RE)) {
    names.add(match[1]);
  }
  return names;
}

function isExcepted(pkg, dep) {
  return EXCEPTIONS.some((e) => e.pkg === pkg && e.dep === dep);
}

export function run() {
  const violations = [];

  const packageDirs = readdirSync(PACKAGES_DIR).filter((name) => {
    try {
      return statSync(join(PACKAGES_DIR, name, 'package.json')).isFile();
    } catch {
      return false;
    }
  });

  for (const dirName of packageDirs) {
    const pkgDir = join(PACKAGES_DIR, dirName);
    const manifest = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'));
    const pkgName = manifest.name ?? dirName;

    const srcImports = collectImportedNames([join(pkgDir, 'src')]);
    const srcOrTestImports = collectImportedNames([join(pkgDir, 'src'), join(pkgDir, 'tests')]);

    for (const [field, imported] of [
      ['dependencies', srcImports],
      ['devDependencies', srcOrTestImports],
    ]) {
      for (const dep of Object.keys(manifest[field] ?? {})) {
        if (!dep.startsWith('@graphorin/')) continue;
        if (imported.has(dep)) continue;
        if (isExcepted(pkgName, dep)) continue;
        const scope = field === 'dependencies' ? 'src/' : 'src/ or tests/';
        violations.push(
          `${pkgName}: ${field} declares ${dep} but nothing under ${scope} imports it ` +
            `(remove the entry, or add it to EXCEPTIONS with a reason)`,
        );
      }
    }

    const declared = new Set([
      ...Object.keys(manifest.dependencies ?? {}),
      ...Object.keys(manifest.peerDependencies ?? {}),
    ]);
    for (const name of collectTsdownExternalNames(join(pkgDir, 'tsdown.config.ts'))) {
      if (declared.has(name)) continue;
      violations.push(
        `${pkgName}: tsdown.config.ts lists ${name} but the manifest declares no such ` +
          `dependency/peerDependency - a future import would build as external without a ` +
          `declared edge (remove the external entry or declare the dependency)`,
      );
    }
  }

  if (violations.length > 0) {
    console.error(`check-phantom-deps: ${violations.length} violation(s)\n`);
    for (const v of violations) console.error(`  - ${v}`);
    return 1;
  }
  console.log(`check-phantom-deps: OK (${packageDirs.length} packages, 0 phantom edges)`);
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exit(run());
}
