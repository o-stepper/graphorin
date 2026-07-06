/**
 * Rule: `@graphorin/no-implicit-network-call` (DEC-154 / ADR-041).
 * Flags any direct network primitive in code under a `@graphorin/*`
 * package's `src/` directory unless the call site carries an opt-out
 * comment whose text contains `'graphorin-allow-network'`:
 *
 * - calls: `fetch(...)`, `http(s).request/get(...)`, `axios(...)` /
 *   `axios.<verb>(...)`, `undici.<verb>(...)` / `got.<verb>(...)`,
 *   `net.createConnection/connect(...)`, `tls.connect(...)`,
 *   `dgram.createSocket(...)`
 * - constructors: `new XMLHttpRequest()`, `new WebSocket(...)`,
 *   `new EventSource(...)`
 * - imports of HTTP clients: `node-fetch`, `undici`, `got`, `axios`,
 *   `ky`, `ws` (static, dynamic `import(...)`, and `require(...)`)
 *
 * Companion to the `pnpm run check-no-network` static analysis script;
 * the two matchers are kept in lockstep (this rule mirrors the EB-10
 * hardening that taught the script about undici/got, raw sockets,
 * WebSocket/EventSource, and HTTP-client import specifiers). The lint
 * surface catches the pattern at author time so reviewers do not need
 * to wait for CI to flag a missed network gate.
 *
 * The rule is intentionally limited to the framework's own code paths
 * - consumer applications can call `fetch` freely. Activation is
 * two-stage (W-039): the linted file path must match
 * `/packages/<pkg>/src/` AND the nearest package.json's `name` must
 * start with one of `options[0].packagePrefixes` (default
 * `['@graphorin/']`), so a downstream pnpm monorepo with the standard
 * `packages/*\/src` layout no longer gets errors on its own `fetch()`
 * calls just for adopting `flat/recommended`.
 *
 * FAIL-OPEN fallback: when no package.json resolves above the file
 * (virtual paths in editor buffers or programmatic `Linter` runs), the
 * rule activates on the path match alone - exactly the pre-W-039
 * behaviour, so a resolution hiccup can only over-flag framework-shaped
 * paths, never silently disable the guard.
 *
 * @packageDocumentation
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import type { Rule } from 'eslint';
import type {
  CallExpression,
  Identifier,
  ImportDeclaration,
  MemberExpression,
  NewExpression,
} from 'estree';

import { nodeHasNearbyComment } from './_comment-utils.js';

const ALLOW_TAG = /graphorin-allow-network/;
const FRAMEWORK_PATH_RE = /\bpackages\/[a-z0-9_-]+\/src\b/;

/**
 * Directory -> nearest package.json `name` (or null when none
 * resolves). Module-level so one walk serves every file of a package
 * within a lint run.
 */
const packageNameCache = new Map<string, string | null>();

/** Walk up from `fileDir` to the nearest package.json name (cached). */
function nearestPackageName(fileDir: string): string | null {
  const cached = packageNameCache.get(fileDir);
  if (cached !== undefined) return cached;
  let name: string | null = null;
  let dir = fileDir;
  for (;;) {
    try {
      const raw = readFileSync(join(dir, 'package.json'), 'utf8');
      const parsed = JSON.parse(raw) as { name?: unknown };
      name = typeof parsed.name === 'string' ? parsed.name : null;
      break;
    } catch {
      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }
  packageNameCache.set(fileDir, name);
  return name;
}

const NETWORK_CALLEES = new Set(['fetch', 'XMLHttpRequest']);
const HTTP_VERBS = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'request']);
const CLIENT_NAMESPACE_VERBS = new Set(['request', 'stream', 'fetch', 'get', 'post']);
const NETWORK_CONSTRUCTORS = new Set(['XMLHttpRequest', 'WebSocket', 'EventSource']);
const HTTP_CLIENT_SPECIFIERS = new Set(['node-fetch', 'undici', 'got', 'axios', 'ky', 'ws']);

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow direct network primitives (`fetch`, `axios`/`undici`/`got`, `http.request`, raw `net`/`tls`/`dgram` sockets, `WebSocket`/`EventSource`/`XMLHttpRequest`, HTTP-client imports) in `@graphorin/*` framework code without an explicit opt-out comment (DEC-154).',
      recommended: true,
    },
    schema: [
      {
        type: 'object',
        properties: {
          packagePrefixes: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      forbidden:
        "direct network call '{{callee}}' in framework code; user actions must initiate network I/O. Add `// graphorin-allow-network: <reason>` to opt out.",
      forbiddenImport:
        "HTTP-client import '{{specifier}}' in framework code; user actions must initiate network I/O. Add `// graphorin-allow-network: <reason>` to opt out.",
    },
  },
  create(context: Rule.RuleContext): Rule.RuleListener {
    const filename = context.filename.replace(/\\/g, '/');
    if (!FRAMEWORK_PATH_RE.test(filename)) {
      return {};
    }
    // W-039 second stage: only packages whose manifest name matches a
    // configured prefix are "framework code". No resolvable manifest ->
    // fail open (path-only activation, the historical behaviour).
    const options = (context.options?.[0] ?? {}) as { packagePrefixes?: readonly string[] };
    const prefixes = options.packagePrefixes ?? ['@graphorin/'];
    const packageName = nearestPackageName(dirname(context.filename));
    if (packageName !== null && !prefixes.some((p) => packageName.startsWith(p))) {
      return {};
    }
    return {
      CallExpression(node: CallExpression): void {
        const specifier = requiredClientSpecifier(node);
        if (specifier !== null) {
          if (hasAllowComment(context, node)) return;
          context.report({
            node,
            messageId: 'forbiddenImport',
            data: { specifier },
          });
          return;
        }
        const name = describeCallee(node);
        if (name === null) return;
        if (hasAllowComment(context, node)) return;
        context.report({
          node,
          messageId: 'forbidden',
          data: { callee: name },
        });
      },
      NewExpression(node: NewExpression): void {
        if (node.callee.type !== 'Identifier') return;
        const callee = node.callee as Identifier;
        if (!NETWORK_CONSTRUCTORS.has(callee.name)) return;
        if (hasAllowComment(context, node)) return;
        context.report({
          node,
          messageId: 'forbidden',
          data: { callee: `new ${callee.name}` },
        });
      },
      ImportDeclaration(node: ImportDeclaration): void {
        const source = node.source.value;
        if (typeof source !== 'string' || !HTTP_CLIENT_SPECIFIERS.has(source)) return;
        if (nodeHasNearbyComment(context, node, ALLOW_TAG, 1)) return;
        context.report({
          node,
          messageId: 'forbiddenImport',
          data: { specifier: source },
        });
      },
      ImportExpression(node: Rule.Node): void {
        const source = (node as { source?: { type?: string; value?: unknown } }).source;
        if (source?.type !== 'Literal' || typeof source.value !== 'string') return;
        if (!HTTP_CLIENT_SPECIFIERS.has(source.value)) return;
        if (nodeHasNearbyComment(context, node as never, ALLOW_TAG, 1)) return;
        context.report({
          node: node as never,
          messageId: 'forbiddenImport',
          data: { specifier: source.value },
        });
      },
    };
  },
};

/** `require('<http client>')` - import-shaped despite being a call. */
function requiredClientSpecifier(node: CallExpression): string | null {
  if (node.callee.type !== 'Identifier') return null;
  if ((node.callee as Identifier).name !== 'require') return null;
  const arg = node.arguments[0];
  if (arg === undefined || arg.type !== 'Literal') return null;
  const value = (arg as { value?: unknown }).value;
  if (typeof value !== 'string' || !HTTP_CLIENT_SPECIFIERS.has(value)) return null;
  return value;
}

function describeCallee(node: CallExpression): string | null {
  if (node.callee.type === 'Identifier') {
    const name = (node.callee as Identifier).name;
    if (NETWORK_CALLEES.has(name) || name === 'axios') return name;
    return null;
  }
  if (node.callee.type === 'MemberExpression') {
    const me = node.callee as MemberExpression;
    if (me.computed) return null;
    const objName = me.object.type === 'Identifier' ? (me.object as Identifier).name : null;
    if (objName === null) return null;
    const propName = me.property.type === 'Identifier' ? (me.property as Identifier).name : null;
    if (propName === null) return null;
    if (
      (objName === 'http' || objName === 'https') &&
      (propName === 'request' || propName === 'get')
    )
      return `${objName}.${propName}`;
    if (objName === 'axios' && HTTP_VERBS.has(propName)) return `axios.${propName}`;
    if ((objName === 'undici' || objName === 'got') && CLIENT_NAMESPACE_VERBS.has(propName))
      return `${objName}.${propName}`;
    if (objName === 'net' && (propName === 'createConnection' || propName === 'connect'))
      return `net.${propName}`;
    if (objName === 'tls' && propName === 'connect') return 'tls.connect';
    if (objName === 'dgram' && propName === 'createSocket') return 'dgram.createSocket';
    return null;
  }
  return null;
}

function hasAllowComment(context: Rule.RuleContext, node: CallExpression | NewExpression): boolean {
  return nodeHasNearbyComment(context, node, ALLOW_TAG, 1);
}

export default rule;
