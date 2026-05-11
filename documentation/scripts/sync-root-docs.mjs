#!/usr/bin/env node
/**
 * sync-root-docs.mjs
 *
 * Mirrors a small set of authoritative top-level Markdown files from the
 * repository root into the documentation tree, prefixed with a banner
 * that explains the file is auto-synced. Single source of truth stays
 * at the repository root.
 *
 *   ../CONTRIBUTING.md            -> contributing/index.md
 *   ../CODE_OF_CONDUCT.md         -> contributing/code-of-conduct.md
 *   ../SECURITY.md                -> contributing/security.md
 *   ../THIRD_PARTY_NOTICES.md     -> contributing/third-party-notices.md
 *   ../CHANGELOG.md               -> reference/changelog.md
 *
 * The script also rewrites in-document references that point at sibling
 * Markdown files (`./LICENSE`, `./CONTRIBUTING.md`, …) so that, on the
 * documentation site, those links land on the GitHub repository copy.
 */

import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const docsRoot = resolve(here, '..');
const repoRoot = resolve(docsRoot, '..');

const REPO_BLOB_BASE = 'https://github.com/o-stepper/graphorin/blob/main';

/** @type {{ from: string; to: string; title: string; description?: string }[]} */
const targets = [
  {
    from: 'CONTRIBUTING.md',
    to: 'contributing/index.md',
    title: 'Contributing',
    description:
      'How to set up the repository, the development workflow, and the project conventions.',
  },
  {
    from: 'CODE_OF_CONDUCT.md',
    to: 'contributing/code-of-conduct.md',
    title: 'Code of Conduct',
    description:
      'Graphorin adopts the Contributor Covenant v2.1. By participating in the project you agree to abide by these expectations.',
  },
  {
    from: 'SECURITY.md',
    to: 'contributing/security.md',
    title: 'Security policy',
    description:
      "Vulnerability disclosure process, supported versions, and the project's privacy and cryptographic baselines.",
  },
  {
    from: 'THIRD_PARTY_NOTICES.md',
    to: 'contributing/third-party-notices.md',
    title: 'Third-party notices',
    description:
      'Runtime, peer, and build-time dependencies pulled in by Graphorin, with versions, licenses, and the role each plays.',
  },
  {
    from: 'CHANGELOG.md',
    to: 'reference/changelog.md',
    title: 'Changelog',
    description:
      'A rolled-up release-note feed for the framework. Per-package CHANGELOGs live in each `@graphorin/*` workspace.',
  },
];

/**
 * Rewrite repository-relative Markdown links so they resolve correctly
 * when the file is rendered on the documentation site.
 */
function rewriteLinks(body) {
  return (
    body
      // ./LICENSE  -> github.com/.../LICENSE
      .replace(/\]\(\.\/(LICENSE|NOTICE|AUTHORS\.md)\)/g, `](${REPO_BLOB_BASE}/$1)`)
      // ./CONTRIBUTING.md / CODE_OF_CONDUCT.md / SECURITY.md / THIRD_PARTY_NOTICES.md
      .replace(/\]\(\.\/(CONTRIBUTING)\.md\)/g, '](/contributing/)')
      .replace(/\]\(\.\/(CODE_OF_CONDUCT)\.md\)/g, '](/contributing/code-of-conduct)')
      .replace(/\]\(\.\/(SECURITY)\.md\)/g, '](/contributing/security)')
      .replace(/\]\(\.\/(THIRD_PARTY_NOTICES)\.md\)/g, '](/contributing/third-party-notices)')
      .replace(/\]\(\.\/(CHANGELOG)\.md\)/g, '](/reference/changelog)')
      .replace(/\]\(\.\/(README)\.md\)/g, `](${REPO_BLOB_BASE}/README.md)`)
      .replace(/\]\(\.\/(\.nvmrc|\.editorconfig)\)/g, `](${REPO_BLOB_BASE}/$1)`)
      .replace(/\]\(\.\/\.github\/([^)]+)\)/g, `](${REPO_BLOB_BASE}/.github/$1)`)
      .replace(/\]\(\.\/scripts\/([^)]+)\)/g, `](${REPO_BLOB_BASE}/scripts/$1)`)
  );
}

/**
 * Strip the first level-1 heading (`# Title`) — VitePress will render the
 * frontmatter `title` instead (we also inject `# ${title}`), so leaving the
 * source H1 in place duplicates the heading on the docs page.
 *
 * Root files may start with HTML comment blocks (e.g. CODE_OF_CONDUCT.md);
 * those are kept; only the first `# ...` line after optional comments is removed.
 */
function stripFirstH1(body) {
  return body.replace(/^(\s*(?:<!--[\s\S]*?-->\s*)*)(#\s[^\n]*\n+)/, '$1');
}

async function syncOne({ from, to, title, description }) {
  const sourcePath = join(repoRoot, from);
  const targetPath = join(docsRoot, to);
  let source;
  try {
    source = await readFile(sourcePath, 'utf8');
  } catch (err) {
    console.warn(`[graphorin/docs] sync-root-docs: skipped '${from}' — ${err?.message || err}`);
    return;
  }
  const banner = [
    '<!--',
    `  This page is auto-synced from /${from} on every documentation build.`,
    `  Do not edit it directly — change /${from} in the repository root.`,
    '-->',
  ].join('\n');
  const frontmatterLines = [
    '---',
    `title: ${title}`,
    description ? `description: ${JSON.stringify(description)}` : undefined,
    'editLink: false',
    '---',
  ].filter((line) => typeof line === 'string');
  const frontmatter = frontmatterLines.join('\n');
  const body = stripFirstH1(rewriteLinks(source));
  const finalBody = `${frontmatter}\n\n${banner}\n\n# ${title}\n\n${body}`.replace(
    /\n{3,}/g,
    '\n\n',
  );
  await mkdir(dirname(targetPath), { recursive: true });
  await writeFile(targetPath, finalBody, 'utf8');
  console.log(`[graphorin/docs] sync-root-docs: wrote ${to}`);
}

async function main() {
  try {
    await stat(repoRoot);
  } catch (err) {
    console.error('[graphorin/docs] sync-root-docs: cannot reach repo root:', err?.message || err);
    process.exit(1);
  }
  for (const target of targets) {
    await syncOne(target);
  }
}

main().catch((err) => {
  console.error('[graphorin/docs] sync-root-docs: fatal:', err);
  process.exit(1);
});
