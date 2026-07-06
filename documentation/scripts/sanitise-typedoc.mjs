#!/usr/bin/env node
/**
 * sanitise-typedoc.mjs
 *
 * Walks `documentation/api/**\/*.md` and escapes raw angle-bracket
 * placeholders (e.g. `<localised builder>`, `<your-token>`) that look
 * like Markdown text but are interpreted as Vue tags by VitePress'
 * template compiler. Without this step, a TypeDoc-generated page that
 * embeds README copy with a placeholder phrase fails the VitePress
 * build with "Element is missing end tag".
 *
 * The script preserves:
 *   - fenced code blocks (```language ... ```)
 *   - inline code spans (`...`)
 *   - real HTML tags from a small allowlist (`<br>`, `<hr>`, `<a>`, …)
 *
 * Anything that survives those filters and matches `< ... >` with a
 * non-tag-like body (whitespace, hyphenated words, multi-word phrases)
 * is escaped as `&lt;` / `&gt;` so the rendered output looks identical
 * but the Vue parser is happy.
 *
 * The walk also rewrites LICENSE file links: TypeDoc copies each
 * package's LICENSE into `api/_media/` as extensionless `LICENSE`,
 * `LICENSE-1`, ... and points README links there (badge links keep
 * their original `./LICENSE` form). VitePress does not ship
 * extensionless files into `dist`, so every one of those links 404s on
 * the built site. All copies carry the same MIT text, so the links are
 * redirected to the canonical file on GitHub (the same convention
 * sync-root-docs.mjs applies to sibling-file links).
 */

import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const apiRoot = resolve(here, '..', 'api');

const HTML_TAG_ALLOWLIST = new Set([
  'a',
  'b',
  'br',
  'code',
  'div',
  'em',
  'hr',
  'i',
  'img',
  'kbd',
  'li',
  'ol',
  'p',
  'pre',
  's',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'u',
  'ul',
  'video',
]);

/**
 * Replaces every `<...>` outside fenced / inline code with HTML-escaped
 * angle brackets, unless `...` looks like a real HTML tag from the
 * allowlist above.
 */
function sanitise(markdown) {
  // Sentinel characters used to mask code regions before the angle-
  // bracket replacement runs. Standard practice for "tokenise +
  // restore" passes; unlikely to clash with anything in real Markdown.
  const FENCE_MARK = '\u0001';
  const SPAN_MARK = '\u0002';

  // First, mask off fenced code blocks so we don't touch them.
  const fences = [];
  let masked = markdown.replace(/```[\s\S]*?(?:```|$(?![\s\S]))/g, (block) => {
    const id = fences.length;
    fences.push(block);
    return `${FENCE_MARK}FENCE${id}${FENCE_MARK}`;
  });

  // Mask inline code spans.
  const spans = [];
  masked = masked.replace(/`[^`\n]*`/g, (span) => {
    const id = spans.length;
    spans.push(span);
    return `${SPAN_MARK}SPAN${id}${SPAN_MARK}`;
  });

  masked = masked.replace(/<([^<>\n]*)>/g, (whole, inner) => {
    const trimmed = inner.trim();
    if (trimmed.length === 0) {
      return whole;
    }
    // Strip a leading `/` (closing-tag form) and any attribute payload
    // before deciding whether the body looks like a real HTML tag.
    const tagName = trimmed
      .replace(/^\//, '')
      .split(/[\s/>]/)[0]
      ?.toLowerCase();
    if (tagName && HTML_TAG_ALLOWLIST.has(tagName)) {
      return whole;
    }
    // Comment-style or DOCTYPE - leave alone.
    if (trimmed.startsWith('!')) {
      return whole;
    }
    // Mailto / URL forms.
    if (trimmed.includes('://') || /^[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(trimmed)) {
      return whole;
    }
    // Otherwise this is README placeholder text. Escape it.
    return `&lt;${inner}&gt;`;
  });

  // Restore inline spans then fences. The control-character markers
  // above are intentional masking sentinels; the regex literals below
  // intentionally include them to undo the masking pass.
  // biome-ignore lint/suspicious/noControlCharactersInRegex: intentional masking sentinel; see FENCE_MARK / SPAN_MARK above.
  masked = masked.replace(/\u0002SPAN(\d+)\u0002/g, (_m, id) => spans[Number(id)]);
  // biome-ignore lint/suspicious/noControlCharactersInRegex: intentional masking sentinel; see FENCE_MARK / SPAN_MARK above.
  masked = masked.replace(/\u0001FENCE(\d+)\u0001/g, (_m, id) => fences[Number(id)]);

  return masked;
}

const REPO_BLOB_BASE = 'https://github.com/o-stepper/graphorin/blob/main';

/**
 * Redirects markdown links whose destination is a TypeDoc-copied
 * LICENSE file (`_media/LICENSE`, `_media/LICENSE-3`, `./LICENSE`, ...)
 * to the canonical LICENSE on GitHub. See the header comment for why
 * the local copies never make it into the built site.
 */
function rewriteLicenseLinks(markdown) {
  return markdown.replace(
    /\]\((?:\.\.?\/)*(?:_media\/)?LICENSE(?:-\d+)?\)/g,
    `](${REPO_BLOB_BASE}/LICENSE)`,
  );
}

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
    if (entry.isFile() && entry.name.endsWith('.md')) {
      yield full;
    }
  }
}

/**
 * W-128 determinism: 'Defined in' references that point into a
 * sibling package's BUILT dist/*.d.ts carry line numbers that are not
 * stable across operating systems (tsdown/rolldown emits declaration
 * member order differently on linux vs macos - observed as swapped
 * #L100/#L102 pairs in protocol's server-message.d.ts). A line number
 * into a generated bundle is useless to a reader anyway, so the
 * sanitiser drops it: link text keeps the file path, the href keeps
 * the file URL without the #L anchor.
 */
function stripDistLineAnchors(text) {
  return text.replace(
    /\[((?:packages\/[^\]]*?\/dist\/[^\]:]+?\.d\.ts)):\d+\]\(([^)#]+)#L\d+\)/g,
    '[$1]($2)',
  );
}

async function main() {
  try {
    await stat(apiRoot);
  } catch {
    console.warn('[graphorin/docs] sanitise-typedoc: api/ does not exist; skipping');
    return;
  }
  let count = 0;
  for await (const file of walkMarkdown(apiRoot)) {
    const before = await readFile(file, 'utf8');
    const after = rewriteLicenseLinks(stripDistLineAnchors(sanitise(before)));
    if (after !== before) {
      await writeFile(file, after, 'utf8');
      count += 1;
    }
  }
  console.log(`[graphorin/docs] sanitise-typedoc: rewrote ${count} file(s)`);
}

main().catch((err) => {
  console.error('[graphorin/docs] sanitise-typedoc: fatal:', err);
  process.exit(1);
});
