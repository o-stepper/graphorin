/**
 * Custom Shiki themes for fenced code blocks.
 *
 * The stock `github-dark-dimmed` / `github-light` pair is blue-dominant
 * and clashes with the site's warm graphite-and-terracotta palette. These
 * themes reuse the syntax-token scheme of the landing page
 * (https://graphorin.com/styles.css, ".c-kw/.c-fn/.c-str/.c-com" tokens)
 * so code reads the same across graphorin.com and docs.graphorin.com:
 *
 *   keywords   terracotta (accent-light)
 *   names      bright text (functions, types, object/JSON/YAML keys)
 *   literals   caramel (strings, numbers, attributes, shell variables)
 *   comments   faint gray, italic
 *   plain text secondary gray, operators muted
 *
 * The light variant maps each role onto the same hues darkened for the
 * `--vp-c-bg-alt` (#F4F4F6) block background; every color clears the
 * WCAG AA 4.5:1 contrast floor on its background.
 *
 * Shape note: shiki's `normalizeTheme` reads the first scope-less entry
 * of `settings` as the default foreground/background pair, so that entry
 * must stay first.
 */

interface ShikiThemeSetting {
  scope?: string | string[];
  settings: { foreground?: string; background?: string; fontStyle?: string };
}

/** Structural subset of shiki's `ThemeRegistrationRaw` (kept dependency-free). */
export interface GraphorinCodeTheme {
  name: string;
  type: 'light' | 'dark';
  colors: Record<string, string>;
  settings: ShikiThemeSetting[];
}

/**
 * Role palette per appearance. Keys mirror the landing-page token names;
 * `plain`/`muted`/`faint` follow its text scale.
 */
const roles = {
  dark: {
    bg: '#131316', // --vp-code-block-bg (graphite, bg-alt)
    plain: '#B8B8BD', // text-secondary
    muted: '#9A9AA3', // text-muted: operators, md quotes
    faint: '#84848D', // text-faint: comments
    keyword: '#FF7A2E', // accent-light
    name: '#F4F4F6', // text-primary
    literal: '#C99A6E', // landing .c-str caramel
    inserted: '#9BB27B',
    removed: '#E0705C',
  },
  light: {
    bg: '#F4F4F6', // --vp-c-bg-alt (default light --vp-code-block-bg)
    plain: '#4F4F57',
    muted: '#6E6E78',
    faint: '#6E6E78',
    keyword: '#B8460A', // accent-dark: the AA-safe terracotta on light
    name: '#15151A',
    literal: '#8C5A28',
    inserted: '#4E7A2E',
    removed: '#B23B2E',
  },
} as const;

function buildTheme(type: 'light' | 'dark'): GraphorinCodeTheme {
  const c = roles[type];
  return {
    name: `graphorin-${type}`,
    type,
    colors: {
      'editor.background': c.bg,
      'editor.foreground': c.plain,
    },
    settings: [
      // Default pair; shiki requires this scope-less entry first.
      { settings: { foreground: c.plain, background: c.bg } },
      {
        scope: 'comment',
        settings: { foreground: c.faint, fontStyle: 'italic' },
      },
      {
        // Words that steer control flow or declare things, plus the
        // keyword-like literals and `this`.
        scope: [
          'keyword',
          'storage',
          'constant.language',
          'variable.language',
          'support.constant',
          'meta.decorator',
          'punctuation.decorator',
          'constant.character.escape',
          'punctuation.definition.template-expression',
          'entity.name.tag',
          'markup.underline.link',
        ],
        settings: { foreground: c.keyword },
      },
      {
        // Symbolic operators stay quiet; word operators above keep the
        // keyword color via the more specific scopes below.
        scope: 'keyword.operator',
        settings: { foreground: c.muted },
      },
      {
        scope: ['keyword.operator.new', 'keyword.operator.expression'],
        settings: { foreground: c.keyword },
      },
      {
        // Literal-ish tokens: the landing's caramel string tone.
        scope: [
          'string',
          'constant.numeric',
          'string.regexp',
          'entity.other.attribute-name',
          'variable.other.normal.shell',
          'variable.other.special.shell',
          'variable.other.positional.shell',
          'punctuation.definition.variable.shell',
          'markup.inline.raw',
        ],
        settings: { foreground: c.literal },
      },
      {
        // Named things: functions, types, and the keys of structured data.
        scope: [
          'entity.name.function',
          'support.function',
          'entity.name.type',
          'entity.name.class',
          'entity.name.namespace',
          'entity.other.inherited-class',
          'support.type',
          'support.class',
          'support.type.property-name',
          'entity.name.tag.yaml',
        ],
        settings: { foreground: c.name },
      },
      {
        scope: ['markup.heading', 'punctuation.definition.heading'],
        settings: { foreground: c.name, fontStyle: 'bold' },
      },
      { scope: 'markup.bold', settings: { fontStyle: 'bold' } },
      { scope: 'markup.italic', settings: { fontStyle: 'italic' } },
      {
        scope: 'markup.quote',
        settings: { foreground: c.muted, fontStyle: 'italic' },
      },
      { scope: 'markup.inserted', settings: { foreground: c.inserted } },
      {
        scope: ['markup.deleted', 'invalid.illegal', 'invalid.deprecated'],
        settings: { foreground: c.removed },
      },
    ],
  };
}

export const graphorinDark: GraphorinCodeTheme = buildTheme('dark');
export const graphorinLight: GraphorinCodeTheme = buildTheme('light');
