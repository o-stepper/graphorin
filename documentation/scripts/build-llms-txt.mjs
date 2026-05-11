#!/usr/bin/env node
/**
 * build-llms-txt.mjs
 *
 * Generates two LLM-friendly artefacts in the VitePress build output
 * (and also into `public/` so `pnpm dev` serves them):
 *
 *   - llms.txt      — the short, navigable index defined by the
 *                     llmstxt.org convention.
 *   - llms-full.txt — concatenated Markdown body of every published
 *                     page, sectioned with stable URL anchors.
 *
 * The script walks the documentation source tree (Markdown only) and
 * leaves the VitePress build output untouched. Run it after a
 * `vitepress build` so that the rendered site is already on disk.
 */

import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const docsRoot = resolve(here, '..');
const distDir = join(docsRoot, '.vitepress', 'dist');
const publicDir = join(docsRoot, 'public');
const SITE_URL = 'https://docs.graphorin.com';

const SECTION_ROOTS = [
  { dir: 'guide', label: 'Guide' },
  { dir: 'reference', label: 'Reference' },
  { dir: 'contributing', label: 'Contributing' },
  { dir: 'api', label: 'API reference' },
];

/** Walk a directory and yield Markdown source files. */
async function* walkMarkdown(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (err) {
    if (err && err.code === 'ENOENT') return;
    throw err;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkMarkdown(full);
      continue;
    }
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith('.md')) continue;
    if (entry.name.startsWith('.')) continue;
    yield full;
  }
}

function frontmatterFields(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return { title: null, description: null, body: source };
  const yaml = match[1];
  const titleLine = yaml.match(/^title:\s*(.+)$/m);
  const descLine = yaml.match(/^description:\s*(.+)$/m);
  const stripQuotes = (s) => s?.trim().replace(/^["']/, '').replace(/["']$/, '');
  return {
    title: stripQuotes(titleLine?.[1]) ?? null,
    description: stripQuotes(descLine?.[1]) ?? null,
    body: source.slice(match[0].length),
  };
}

function firstHeading(body) {
  const m = body.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : null;
}

function firstParagraph(body) {
  const stripped = body.replace(/^#.*$/gm, '').replace(/^>.*$/gm, '');
  const m = stripped.match(/[^\n][^\n]+/);
  return m ? m[0].trim() : '';
}

function relativeToSection(absPath, sectionDir) {
  return relative(sectionDir, absPath).replace(/\\/g, '/');
}

function pageUrlFor(sectionDir, absPath) {
  const rel = relativeToSection(absPath, sectionDir);
  let route = rel.replace(/\.md$/, '');
  if (route === 'index') route = '';
  if (route.endsWith('/index')) route = route.slice(0, -'/index'.length);
  return `${SITE_URL}/${relative(docsRoot, sectionDir)}/${route}`.replace(/\/+$/, '');
}

async function collectSection(section) {
  const sectionDir = join(docsRoot, section.dir);
  const items = [];
  for await (const file of walkMarkdown(sectionDir)) {
    const raw = await readFile(file, 'utf8');
    const { title, description, body } = frontmatterFields(raw);
    items.push({
      file,
      url: pageUrlFor(sectionDir, file),
      title: title ?? firstHeading(body) ?? relativeToSection(file, sectionDir),
      description: description ?? firstParagraph(body),
      body,
    });
  }
  items.sort((a, b) => a.url.localeCompare(b.url));
  return items;
}

async function main() {
  const sections = [];
  for (const section of SECTION_ROOTS) {
    sections.push({ ...section, pages: await collectSection(section) });
  }

  const indexLines = [
    '# Graphorin',
    '',
    '> TypeScript framework for building long-living personal AI assistants.',
    '> Local-first, vendor-neutral, durable, observable, type-safe.',
    '> Created and maintained by Oleksiy Stepurenko. MIT License.',
    '',
    `- Website: ${SITE_URL}`,
    '- Landing page: https://graphorin.com',
    '- Repository: https://github.com/o-stepper/graphorin',
    '- Maintainer: Oleksiy Stepurenko <step.oleksiy@gmail.com>',
    '- License: MIT (© 2026 Oleksiy Stepurenko)',
    '',
  ];

  for (const section of sections) {
    if (section.pages.length === 0) continue;
    indexLines.push(`## ${section.label}`, '');
    for (const page of section.pages) {
      const desc = page.description ? `: ${page.description}` : '';
      indexLines.push(`- [${page.title}](${page.url})${desc}`);
    }
    indexLines.push('');
  }

  const llmsTxt = indexLines.join('\n');

  const fullChunks = [
    '# Graphorin — full documentation snapshot',
    '',
    'This is the auto-generated, machine-readable concatenation of every',
    'public documentation page. It is intended for consumption by AI',
    'assistants — see the short index at /llms.txt.',
    '',
    `Source: ${SITE_URL}`,
    'Repository: https://github.com/o-stepper/graphorin',
    'Maintainer: Oleksiy Stepurenko <step.oleksiy@gmail.com>',
    'License: MIT (© 2026 Oleksiy Stepurenko)',
    '',
  ];

  for (const section of sections) {
    if (section.pages.length === 0) continue;
    fullChunks.push(`# === ${section.label} ===`, '');
    for (const page of section.pages) {
      fullChunks.push('---');
      fullChunks.push(`url: ${page.url}`);
      fullChunks.push(`title: ${page.title}`);
      if (page.description) fullChunks.push(`description: ${page.description}`);
      fullChunks.push('---', '');
      fullChunks.push(page.body.trim(), '');
    }
  }

  const llmsFullTxt = fullChunks.join('\n');

  // Always write into /public so dev mode serves the artefacts.
  await mkdir(publicDir, { recursive: true });
  await writeFile(join(publicDir, 'llms.txt'), llmsTxt, 'utf8');
  await writeFile(join(publicDir, 'llms-full.txt'), llmsFullTxt, 'utf8');
  console.log(`[graphorin/docs] llms.txt: wrote ${llmsTxt.length} chars to public/llms.txt`);
  console.log(
    `[graphorin/docs] llms-full.txt: wrote ${llmsFullTxt.length} chars to public/llms-full.txt`,
  );

  // Mirror into the build output if VitePress has already produced one.
  try {
    await stat(distDir);
    await writeFile(join(distDir, 'llms.txt'), llmsTxt, 'utf8');
    await writeFile(join(distDir, 'llms-full.txt'), llmsFullTxt, 'utf8');
    console.log('[graphorin/docs] llms.txt: mirrored into .vitepress/dist');
  } catch {
    /* no build output yet — running before `vitepress build`; ok */
  }
}

main().catch((err) => {
  console.error('[graphorin/docs] build-llms-txt: fatal:', err);
  process.exit(1);
});
