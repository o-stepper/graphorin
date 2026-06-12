import type { SecretRef as SecretRefContract } from '@graphorin/core/contracts';

import { SecretRefParseError, type SecretRefParseErrorKind } from './errors.js';
import { listResolverSchemes } from './resolvers/registry.js';

/**
 * Set of scheme names the parser knows about by default. Every entry
 * corresponds to a built-in resolver shipped from `./resolvers/`.
 *
 * @stable
 */
export const BUILTIN_SCHEMES: ReadonlyArray<string> = Object.freeze([
  'env',
  'keyring',
  'file',
  'encrypted-file',
  'literal',
  'ref',
  'vault',
]);

/**
 * Schemes that **forbid** an authority component (no `//` allowed).
 *
 * @stable
 */
export const OPAQUE_ONLY_SCHEMES: ReadonlySet<string> = new Set([
  'env',
  'keyring',
  'literal',
  'ref',
]);

/**
 * Schemes whose authority component is optional. `file:` and
 * `encrypted-file:` accept either `file:///abs/path` (authority empty)
 * or `file:relative/path` (opaque). `vault://` accepts both an explicit
 * server (`vault://host:port/...`) and an opaque form that defers to
 * the `VAULT_ADDR` environment variable.
 *
 * @stable
 */
export const AUTHORITY_OPTIONAL_SCHEMES: ReadonlySet<string> = new Set([
  'file',
  'encrypted-file',
  'vault',
]);

/**
 * Internal parsed shape for a single `SecretRef` URI. Conforms to the
 * cross-package `SecretRef` contract declared in `@graphorin/core` and
 * adds nothing on top of it — richer access (split authority, per-key
 * multi-value query) is exposed through dedicated helpers below.
 *
 * @stable
 */
export interface ParsedSecretRef extends SecretRefContract {
  readonly raw: string;
  readonly scheme: string;
  readonly authority?: string;
  readonly path: string;
  readonly query: Readonly<Record<string, string>>;
  readonly fragment?: string;
}

/**
 * Result of `validateSecretRefs(...)`. Lists every problem found during
 * a recursive walk over a config object.
 *
 * @stable
 */
export interface SecretRefValidationResult {
  readonly ok: boolean;
  readonly issues: ReadonlyArray<{
    readonly path: ReadonlyArray<string | number>;
    readonly raw: unknown;
    readonly error: SecretRefParseError;
  }>;
}

/**
 * Options for `validateSecretRefs(...)`.
 *
 * @stable
 */
export interface ValidateSecretRefsOptions {
  /**
   * Allow `literal:` refs in the input. Off by default — `literal:` is
   * gated by the resolver, but validation can fail-fast as well.
   */
  readonly allowLiteral?: boolean;
  /**
   * Names of fields that should be treated as `*Ref` strings. Defaults
   * to a heuristic match: any string-valued field whose key ends in
   * `Ref`, `_ref`, `REF`, or `_REF`.
   */
  readonly fieldNameMatcher?: (key: string) => boolean;
  /**
   * Restrict the accepted scheme set. Defaults to `BUILTIN_SCHEMES`
   * plus any scheme registered through `registerResolver(...)`.
   */
  readonly knownSchemes?: ReadonlyArray<string>;
}

const ALPHA_RE = /^[A-Za-z]$/;
const SCHEME_TAIL_RE = /^[A-Za-z0-9+\-.]$/;
const HEX_RE = /^[0-9A-Fa-f]$/;

const UNRESERVED_RE = /^[A-Za-z0-9\-._~]$/;
const SUB_DELIMS_RE = /^[!$&'()*+,;=]$/;

function isUnreserved(ch: string): boolean {
  return UNRESERVED_RE.test(ch);
}
function isSubDelim(ch: string): boolean {
  return SUB_DELIMS_RE.test(ch);
}

function isPchar(ch: string): boolean {
  // pchar = unreserved / pct-encoded / sub-delims / ":" / "@"
  return isUnreserved(ch) || isSubDelim(ch) || ch === ':' || ch === '@';
}

function isQueryChar(ch: string): boolean {
  // query = *( pchar / "/" / "?" )
  return isPchar(ch) || ch === '/' || ch === '?';
}

/**
 * Strict RFC 3986 percent-decoder. Rejects malformed `%xy` sequences
 * by throwing `SecretRefParseError({ kind: 'invalid-percent-encoding' })`.
 */
function percentDecode(input: string, raw: string, offset: number): string {
  let out = '';
  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    if (ch === undefined) continue;
    if (ch !== '%') {
      out += ch;
      continue;
    }
    const hi = input[i + 1];
    const lo = input[i + 2];
    if (hi === undefined || lo === undefined || !HEX_RE.test(hi) || !HEX_RE.test(lo)) {
      throw new SecretRefParseError(
        'invalid-percent-encoding',
        `Malformed percent-encoded triplet at position ${offset + i} of '${raw}'.`,
        raw,
        offset + i,
      );
    }
    out += String.fromCharCode(Number.parseInt(`${hi}${lo}`, 16));
    i += 2;
  }
  return out;
}

/**
 * Validate the scheme component (RFC 3986 § 3.1: ALPHA *( ALPHA / DIGIT
 * / "+" / "-" / "." )) and return its lowercase form. Throws a typed
 * parse error otherwise.
 */
function readScheme(input: string): { scheme: string; afterColon: number } {
  if (input.length === 0) {
    throw new SecretRefParseError('empty-input', 'SecretRef is empty.', input, 0);
  }
  const first = input[0];
  if (first === undefined || !ALPHA_RE.test(first)) {
    throw new SecretRefParseError(
      'invalid-scheme',
      `SecretRef scheme must start with an ASCII letter; got '${first ?? ''}'.`,
      input,
      0,
    );
  }
  let i = 1;
  while (i < input.length) {
    const ch = input[i];
    if (ch === ':') break;
    if (ch === undefined || !SCHEME_TAIL_RE.test(ch)) {
      throw new SecretRefParseError(
        'invalid-scheme',
        `Invalid character '${ch ?? ''}' in scheme at position ${i}.`,
        input,
        i,
      );
    }
    i += 1;
  }
  if (input[i] !== ':') {
    throw new SecretRefParseError(
      'malformed-uri',
      `SecretRef '${input}' is missing the ':' delimiter after the scheme.`,
      input,
      i,
    );
  }
  return { scheme: input.slice(0, i).toLowerCase(), afterColon: i + 1 };
}

/**
 * Read the authority component when the URI uses the `//authority`
 * prefix. Returns the raw authority slice (including any `userinfo@`
 * prefix and `:port` suffix) and the index of the next character.
 *
 * Authority terminates at `/`, `?`, `#`, or end-of-input.
 */
function readAuthority(input: string, start: number): { authority: string; next: number } {
  let i = start;
  while (i < input.length) {
    const ch = input[i];
    if (ch === '/' || ch === '?' || ch === '#') break;
    i += 1;
  }
  return { authority: input.slice(start, i), next: i };
}

function readPath(
  input: string,
  start: number,
  hasAuthority: boolean,
): {
  path: string;
  next: number;
} {
  let i = start;
  let firstSegment = true;
  while (i < input.length) {
    const ch = input[i];
    if (ch === '?' || ch === '#') break;
    if (ch === '/') {
      firstSegment = false;
      i += 1;
      continue;
    }
    if (ch === undefined || (!isPchar(ch) && ch !== '%')) {
      throw new SecretRefParseError(
        'malformed-uri',
        `Invalid character '${ch ?? ''}' in path at position ${i}.`,
        input,
        i,
      );
    }
    if (ch === '%') {
      // pct-encoded: %HEXDIG HEXDIG; validated during percent-decoding.
      const hi = input[i + 1];
      const lo = input[i + 2];
      if (hi === undefined || lo === undefined || !HEX_RE.test(hi) || !HEX_RE.test(lo)) {
        throw new SecretRefParseError(
          'invalid-percent-encoding',
          `Malformed percent-encoded triplet at position ${i}.`,
          input,
          i,
        );
      }
      i += 3;
      continue;
    }
    i += 1;
    firstSegment = false;
  }
  // Confirm the opaque form rule: when no authority, the first segment
  // must be non-empty (segment-nz). Empty path is allowed for `vault:`
  // when authority is present and no path follows.
  if (!hasAuthority && i === start) {
    throw new SecretRefParseError(
      'empty-path',
      `SecretRef has an empty path component (no authority either).`,
      input,
      start,
    );
  }
  void firstSegment;
  return { path: input.slice(start, i), next: i };
}

function readQueryRaw(input: string, start: number): { rawQuery: string; next: number } {
  if (input[start] !== '?') return { rawQuery: '', next: start };
  let i = start + 1;
  while (i < input.length) {
    const ch = input[i];
    if (ch === '#') break;
    if (ch === undefined || (!isQueryChar(ch) && ch !== '%')) {
      throw new SecretRefParseError(
        'malformed-uri',
        `Invalid character '${ch ?? ''}' in query at position ${i}.`,
        input,
        i,
      );
    }
    if (ch === '%') {
      const hi = input[i + 1];
      const lo = input[i + 2];
      if (hi === undefined || lo === undefined || !HEX_RE.test(hi) || !HEX_RE.test(lo)) {
        throw new SecretRefParseError(
          'invalid-percent-encoding',
          `Malformed percent-encoded triplet at position ${i}.`,
          input,
          i,
        );
      }
      i += 3;
      continue;
    }
    i += 1;
  }
  return { rawQuery: input.slice(start + 1, i), next: i };
}

function readFragmentRaw(input: string, start: number): string {
  if (input[start] !== '#') return '';
  let i = start + 1;
  while (i < input.length) {
    const ch = input[i];
    if (ch === undefined || (!isQueryChar(ch) && ch !== '%')) {
      throw new SecretRefParseError(
        'malformed-uri',
        `Invalid character '${ch ?? ''}' in fragment at position ${i}.`,
        input,
        i,
      );
    }
    if (ch === '%') {
      const hi = input[i + 1];
      const lo = input[i + 2];
      if (hi === undefined || lo === undefined || !HEX_RE.test(hi) || !HEX_RE.test(lo)) {
        throw new SecretRefParseError(
          'invalid-percent-encoding',
          `Malformed percent-encoded triplet at position ${i}.`,
          input,
          i,
        );
      }
      i += 3;
      continue;
    }
    i += 1;
  }
  return input.slice(start + 1, i);
}

/**
 * Parse a single query string into a key→last-value record. The original
 * raw query is preserved on `ParsedSecretRef.raw` so multi-value
 * accessors can re-scan when needed.
 */
function parseQueryString(rawQuery: string, raw: string, offset: number): Record<string, string> {
  if (rawQuery.length === 0) return Object.create(null) as Record<string, string>;
  const out: Record<string, string> = Object.create(null);
  for (const piece of rawQuery.split('&')) {
    if (piece.length === 0) continue;
    const eq = piece.indexOf('=');
    const rawKey = eq === -1 ? piece : piece.slice(0, eq);
    const rawVal = eq === -1 ? '' : piece.slice(eq + 1);
    const key = percentDecode(rawKey.replace(/\+/g, ' '), raw, offset);
    const value = percentDecode(rawVal.replace(/\+/g, ' '), raw, offset);
    out[key] = value;
  }
  return out;
}

/**
 * Strict RFC 3986-subset parser for `SecretRef` URIs. Rejects every
 * input that does not conform to the grammar declared in the
 * architecture spec; never silently falls back to a default scheme.
 *
 * @stable
 */
export function parseSecretRef(uri: string): ParsedSecretRef {
  if (typeof uri !== 'string') {
    throw new SecretRefParseError(
      'malformed-uri',
      `Expected SecretRef to be a string; got ${typeof uri}.`,
      String(uri),
      0,
    );
  }
  if (uri.length === 0) {
    throw new SecretRefParseError('empty-input', 'SecretRef is empty.', uri, 0);
  }

  const { scheme, afterColon } = readScheme(uri);

  let cursor = afterColon;
  let authorityRaw: string | undefined;
  let hasAuthority = false;

  if (uri[cursor] === '/' && uri[cursor + 1] === '/') {
    if (OPAQUE_ONLY_SCHEMES.has(scheme)) {
      throw new SecretRefParseError(
        'unexpected-authority',
        `Scheme '${scheme}:' does not accept an authority component (no '//' allowed).`,
        uri,
        cursor,
      );
    }
    cursor += 2;
    const result = readAuthority(uri, cursor);
    authorityRaw = result.authority;
    cursor = result.next;
    hasAuthority = true;
  }

  const { path: rawPath, next: afterPath } = readPath(uri, cursor, hasAuthority);
  const path = percentDecode(rawPath, uri, cursor);

  const { rawQuery, next: afterQuery } = readQueryRaw(uri, afterPath);
  const query = parseQueryString(rawQuery, uri, afterPath + 1);

  const fragmentRaw = readFragmentRaw(uri, afterQuery);
  const fragment = fragmentRaw.length > 0 ? percentDecode(fragmentRaw, uri, afterQuery + 1) : '';

  // Authority semantics per scheme:
  // - schemes in OPAQUE_ONLY_SCHEMES forbid the `//` prefix
  //   (already enforced earlier).
  // - every other scheme — built-in or user-registered — accepts both
  //   the opaque (`scheme:path`) and authority-bearing (`scheme://host`)
  //   forms. Stricter requirements for individual schemes (e.g.
  //   `op://`, `azure-kv://` requiring an authority) are the resolver's
  //   responsibility.
  if (hasAuthority && authorityRaw === undefined) {
    // Unreachable in practice; kept for type narrowing.
    authorityRaw = '';
  }

  const parsed: ParsedSecretRef = {
    raw: uri,
    scheme,
    ...(hasAuthority ? { authority: authorityRaw ?? '' } : {}),
    path,
    query,
    ...(fragmentRaw.length > 0 ? { fragment } : {}),
  };
  return Object.freeze(parsed);
}

/**
 * Split an authority string of the form `[userinfo@]host[:port]` into
 * its components. `host` is lowercased per RFC 3986; userinfo and port
 * are returned verbatim. Returns `undefined` if the authority is empty.
 *
 * @stable
 */
export function parseAuthority(authority: string):
  | {
      readonly userinfo?: string;
      readonly host: string;
      readonly port?: number;
    }
  | undefined {
  if (authority.length === 0) return undefined;
  let userinfo: string | undefined;
  let rest = authority;
  const at = authority.lastIndexOf('@');
  if (at !== -1) {
    userinfo = authority.slice(0, at);
    rest = authority.slice(at + 1);
  }
  let host = rest;
  let port: number | undefined;
  // Detect port: last ':' that is not inside an IPv6 bracket.
  if (rest.startsWith('[')) {
    const close = rest.indexOf(']');
    if (close === -1) {
      throw new SecretRefParseError(
        'malformed-uri',
        `IPv6 host literal is missing closing ']' in authority '${authority}'.`,
        authority,
      );
    }
    host = rest.slice(0, close + 1);
    const trailer = rest.slice(close + 1);
    if (trailer.startsWith(':')) port = parsePort(trailer.slice(1), authority);
    else if (trailer.length > 0) {
      throw new SecretRefParseError(
        'malformed-uri',
        `Unexpected characters after IPv6 host in authority '${authority}'.`,
        authority,
      );
    }
  } else {
    const portIndex = rest.lastIndexOf(':');
    if (portIndex !== -1) {
      host = rest.slice(0, portIndex);
      port = parsePort(rest.slice(portIndex + 1), authority);
    }
  }
  const out: { userinfo?: string; host: string; port?: number } = { host: host.toLowerCase() };
  if (userinfo !== undefined) out.userinfo = userinfo;
  if (port !== undefined) out.port = port;
  return Object.freeze(out);
}

function parsePort(raw: string, authority: string): number {
  if (!/^\d+$/.test(raw)) {
    throw new SecretRefParseError(
      'malformed-uri',
      `Invalid port '${raw}' in authority '${authority}'.`,
      authority,
    );
  }
  const n = Number.parseInt(raw, 10);
  if (n < 0 || n > 65535) {
    throw new SecretRefParseError(
      'malformed-uri',
      `Port ${n} out of range in authority '${authority}'.`,
      authority,
    );
  }
  return n;
}

/**
 * Read a single query parameter from a parsed ref. Returns `undefined`
 * if the parameter is not present.
 *
 * @stable
 */
export function getQueryParam(ref: ParsedSecretRef, key: string): string | undefined {
  return Object.hasOwn(ref.query, key) ? ref.query[key] : undefined;
}

/**
 * Read a query parameter and throw if it is missing. Useful for
 * resolver implementations that require a configuration value.
 *
 * @stable
 */
export function getQueryParamRequired(ref: ParsedSecretRef, key: string): string {
  const value = getQueryParam(ref, key);
  if (value === undefined) {
    throw new SecretRefParseError(
      'malformed-uri',
      `Required query parameter '${key}' is missing from SecretRef '${ref.raw}'.`,
      ref.raw,
    );
  }
  return value;
}

/**
 * Read every value associated with `key` in the original query string
 * (multi-value support). Returns an empty array if the parameter is
 * not present.
 *
 * @stable
 */
export function getQueryParamAll(ref: ParsedSecretRef, key: string): ReadonlyArray<string> {
  const qIndex = ref.raw.indexOf('?');
  if (qIndex === -1) return [];
  const hashIndex = ref.raw.indexOf('#', qIndex + 1);
  const rawQuery = ref.raw.slice(qIndex + 1, hashIndex === -1 ? undefined : hashIndex);
  if (rawQuery.length === 0) return [];
  const out: string[] = [];
  for (const piece of rawQuery.split('&')) {
    if (piece.length === 0) continue;
    const eq = piece.indexOf('=');
    const rawKey = eq === -1 ? piece : piece.slice(0, eq);
    const rawVal = eq === -1 ? '' : piece.slice(eq + 1);
    const decodedKey = percentDecode(rawKey.replace(/\+/g, ' '), ref.raw, qIndex + 1);
    if (decodedKey === key) {
      out.push(percentDecode(rawVal.replace(/\+/g, ' '), ref.raw, qIndex + 1));
    }
  }
  return out;
}

const DEFAULT_REF_FIELD_MATCHER = (key: string): boolean => /(?:Ref|REF|_ref|_REF)$/.test(key);

/**
 * Walks an arbitrary configuration object and validates every `*Ref`
 * field. Returns a structured result rather than throwing, so callers
 * can collect every issue before deciding to bail out.
 *
 * @stable
 */
export function validateSecretRefs(
  config: unknown,
  opts: ValidateSecretRefsOptions = {},
): SecretRefValidationResult {
  const issues: Array<{
    path: ReadonlyArray<string | number>;
    raw: unknown;
    error: SecretRefParseError;
  }> = [];

  const matcher = opts.fieldNameMatcher ?? DEFAULT_REF_FIELD_MATCHER;
  // SPL-15: as documented — BUILTIN_SCHEMES plus every scheme registered
  // through registerResolver, consulted at CALL time (op:// etc. no
  // longer flags unknown once its resolver is installed).
  const knownSchemes = new Set(
    (opts.knownSchemes ?? [...BUILTIN_SCHEMES, ...listResolverSchemes()]).map((s) =>
      s.toLowerCase(),
    ),
  );
  const allowLiteral = opts.allowLiteral ?? false;
  const seen = new WeakSet<object>();

  const visit = (value: unknown, path: ReadonlyArray<string | number>): void => {
    if (value === null || value === undefined) return;
    if (typeof value === 'object') {
      // Avoid infinite recursion on cyclic config objects.
      if (seen.has(value as object)) return;
      seen.add(value as object);
      if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i += 1) {
          visit(value[i], [...path, i]);
        }
        return;
      }
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        if (typeof v === 'string' && matcher(k)) {
          try {
            const parsed = parseSecretRef(v);
            if (!knownSchemes.has(parsed.scheme)) {
              issues.push({
                path: [...path, k],
                raw: v,
                error: new SecretRefParseError(
                  'unknown-scheme',
                  `Unknown SecretRef scheme '${parsed.scheme}' in '${v}'. Register a resolver or use one of: ${[...knownSchemes].join(', ')}.`,
                  v,
                ),
              });
            } else if (!allowLiteral && parsed.scheme === 'literal') {
              issues.push({
                path: [...path, k],
                raw: v,
                error: new SecretRefParseError(
                  'unknown-scheme',
                  `'literal:' SecretRefs are forbidden by default; pass { allowLiteral: true } only for tests.`,
                  v,
                ),
              });
            }
          } catch (err) {
            if (err instanceof SecretRefParseError) {
              issues.push({ path: [...path, k], raw: v, error: err });
            } else {
              throw err;
            }
          }
          continue;
        }
        visit(v, [...path, k]);
      }
    }
  };

  visit(config, []);
  return Object.freeze({ ok: issues.length === 0, issues: Object.freeze(issues) });
}

/**
 * Reject naked strings (no scheme) at validation time. Used by the
 * resolver dispatcher so a typo in `*Ref` config does not silently fall
 * through to a default scheme.
 *
 * @stable
 */
export function assertNotNakedString(input: string): void {
  // A naked string has no `:` separator at all OR uses only `:` as the
  // body (e.g. `:foo`).
  const colonIdx = input.indexOf(':');
  if (colonIdx <= 0) {
    throw new SecretRefParseError(
      'naked-string',
      `Refused naked secret string '${input}': must use a scheme prefix (e.g. 'env:', 'keyring:').`,
      input,
      colonIdx,
    );
  }
}

/**
 * Convenience: parse if the input looks like a URI, otherwise throw a
 * `naked-string` parse error. Used by `resolveSecret(...)`.
 *
 * @stable
 */
export function parseOrAssert(input: string): ParsedSecretRef {
  assertNotNakedString(input);
  return parseSecretRef(input);
}

/**
 * Map `SecretRefParseErrorKind` to a human-friendly string. Useful for
 * diagnostic messages in `graphorin doctor --check-secrets`.
 *
 * @stable
 */
export function describeParseErrorKind(kind: SecretRefParseErrorKind): string {
  switch (kind) {
    case 'empty-input':
      return 'SecretRef is empty';
    case 'malformed-uri':
      return 'SecretRef does not match the RFC 3986 subset grammar';
    case 'invalid-scheme':
      return 'Scheme component is invalid';
    case 'unknown-scheme':
      return 'No resolver is registered for this scheme';
    case 'missing-authority':
      return 'Required authority (//host[:port]) is missing';
    case 'unexpected-authority':
      return 'Authority is not allowed for this scheme';
    case 'empty-path':
      return 'Path component is empty';
    case 'invalid-percent-encoding':
      return 'Malformed percent-encoded triplet';
    case 'naked-string':
      return 'Bare value without a scheme prefix';
  }
}
