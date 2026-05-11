/**
 * Scope grammar for server auth. Scopes follow the canonical
 * `<resource>:<action>[:<id-or-glob>]` form so middleware can map an
 * incoming HTTP route or RPC call to a single required scope and
 * compare it against the granted set carried on the token.
 *
 * The grammar is deliberately small: lowercase ASCII for the
 * `resource` and `action` segments; the optional final segment accepts
 * either a wildcard (`*`) or a slug-like identifier (UUID, ULID, or
 * arbitrary `[A-Za-z0-9_-]+`).
 *
 * @packageDocumentation
 */

import { ScopeParseError } from './errors.js';

/**
 * Result of `parseScope(...)`. The `kind` discriminator lets callers
 * branch between two- and three-segment scopes without re-parsing the
 * raw string.
 *
 * @stable
 */
export type ParsedScope =
  | {
      readonly kind: 'two-segment';
      readonly resource: string;
      readonly action: string;
      readonly raw: string;
    }
  | {
      readonly kind: 'three-segment';
      readonly resource: string;
      readonly action: string;
      readonly target: string;
      readonly raw: string;
    };

const RESOURCE_RE = /^[a-z][a-z0-9-]{0,31}$/;
const ACTION_RE = /^[a-z][a-z0-9-]*$|^\*$/;
const TARGET_RE = /^([A-Za-z0-9_.-]{1,128}|\*)$/;

/**
 * Parse a single scope string. Throws `ScopeParseError` for any input
 * that does not match the canonical grammar; never silently coerces.
 *
 * @stable
 */
export function parseScope(input: string): ParsedScope {
  if (typeof input !== 'string' || input.length === 0) {
    throw new ScopeParseError(String(input ?? ''), 'input is empty');
  }
  const segments = input.split(':');
  if (segments.length < 2 || segments.length > 3) {
    throw new ScopeParseError(
      input,
      `expected 2 or 3 colon-separated segments, got ${segments.length}`,
    );
  }
  const [resource, action, target] = segments as [string, string, string | undefined];
  if (!RESOURCE_RE.test(resource)) {
    throw new ScopeParseError(input, `invalid resource '${resource}'`);
  }
  if (!ACTION_RE.test(action)) {
    throw new ScopeParseError(input, `invalid action '${action}'`);
  }
  if (target === undefined) {
    return Object.freeze({ kind: 'two-segment', resource, action, raw: input });
  }
  if (!TARGET_RE.test(target)) {
    throw new ScopeParseError(input, `invalid target '${target}'`);
  }
  return Object.freeze({ kind: 'three-segment', resource, action, target, raw: input });
}

/**
 * Try-parse helper. Returns `undefined` on failure rather than
 * throwing; useful when iterating over a granted set that may include
 * legacy strings.
 *
 * @stable
 */
export function tryParseScope(input: string): ParsedScope | undefined {
  try {
    return parseScope(input);
  } catch {
    return undefined;
  }
}

/**
 * Match a single granted scope against a single required scope.
 *
 * Rules:
 * - `admin:*` matches every scope.
 * - Resource segment: must be exact match.
 * - Action segment: exact match, or granted action `*` matches any
 *   required action.
 * - Optional target segment: a granted three-segment scope only
 *   matches a three-segment requirement; `*` in the granted target
 *   matches any required target. A granted two-segment scope matches
 *   a required three-segment scope when the resource and action align
 *   (a two-segment grant is broader than a three-segment grant).
 *
 * @stable
 */
export function scopeMatches(granted: ParsedScope, required: ParsedScope): boolean {
  if (granted.resource === 'admin' && granted.action === '*') return true;
  if (granted.resource !== required.resource) return false;
  if (granted.action !== '*' && granted.action !== required.action) return false;
  if (required.kind === 'two-segment') {
    return granted.kind === 'two-segment' || granted.target === '*';
  }
  // required is three-segment.
  if (granted.kind === 'two-segment') return true;
  if (granted.target === '*') return true;
  return granted.target === required.target;
}

/**
 * Match a granted set against a required scope. Strings inside
 * `granted` that fail to parse are skipped (they cannot grant
 * anything).
 *
 * @stable
 */
export function scopeSetMatches(
  granted: ReadonlyArray<string | ParsedScope>,
  required: string | ParsedScope,
): boolean {
  const requiredScope = typeof required === 'string' ? parseScope(required) : required;
  for (const entry of granted) {
    const parsed = typeof entry === 'string' ? tryParseScope(entry) : entry;
    if (parsed === undefined) continue;
    if (scopeMatches(parsed, requiredScope)) return true;
  }
  return false;
}

/**
 * Canonical catalogue of scopes recognised by the framework. Wider
 * deployments are free to introduce additional scope strings; the
 * catalogue exists so middleware authors can reference a single
 * source of truth and so the CLI can enumerate the well-known scopes
 * for tab-completion.
 *
 * @stable
 */
export const SCOPE_CATALOGUE: ReadonlyArray<string> = Object.freeze([
  'agents:read',
  'agents:invoke',
  'agents:invoke:*',
  'memory:read',
  'memory:write',
  'memory:read:raw',
  'workflows:read',
  'workflows:execute',
  'workflows:resume',
  'workflows:resume:*',
  'sessions:read',
  'sessions:write',
  'sessions:export',
  'sessions:replay',
  'traces:read:sanitized',
  'traces:read:raw',
  'mcp:admin',
  'triggers:read',
  'triggers:fire',
  'triggers:disable',
  'tokens:create',
  'tokens:revoke',
  'tokens:list',
  'skills:read',
  'skills:install',
  'skills:audit',
  'audit:read',
  'audit:export',
  'admin:*',
]);

/**
 * Validate that every entry in a granted set is a syntactically valid
 * scope. Returns the parse errors collected during the walk, or an
 * empty array if every entry parsed.
 *
 * @stable
 */
export function validateScopeSet(scopes: ReadonlyArray<string>): ReadonlyArray<ScopeParseError> {
  const errors: ScopeParseError[] = [];
  for (const scope of scopes) {
    try {
      parseScope(scope);
    } catch (err) {
      if (err instanceof ScopeParseError) errors.push(err);
      else throw err;
    }
  }
  return Object.freeze(errors);
}
