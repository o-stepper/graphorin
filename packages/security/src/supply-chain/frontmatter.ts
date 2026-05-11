/**
 * Minimal SKILL.md frontmatter helpers used by the signature
 * verification pipeline.
 *
 * The framework parses YAML through the `yaml` library to keep the
 * surface predictable across publishers. The canonicalisation step
 * removes the `graphorin-signature` block, sorts keys recursively,
 * and emits canonical JSON over the result so the bytes the verifier
 * computes never depend on incidental whitespace.
 *
 * @packageDocumentation
 */

import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

import { SkillManifestParseError } from './errors.js';
import type { SkillSignatureBlock } from './types.js';

/** Result of {@link splitFrontmatter}. */
export interface SplitFrontmatter {
  readonly frontmatter: string;
  readonly body: string;
}

/**
 * Split `skillMd` into the YAML frontmatter and the markdown body.
 * Throws {@link SkillManifestParseError} when no frontmatter block is
 * present.
 *
 * @stable
 */
export function splitFrontmatter(skillMd: string): SplitFrontmatter {
  const normalized = skillMd.replace(/^\uFEFF/u, '').replace(/\r\n/g, '\n');
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/u.exec(normalized);
  if (match === null) {
    throw new SkillManifestParseError(
      'SKILL.md must begin with a YAML frontmatter block delimited by `---` lines.',
    );
  }
  return {
    frontmatter: match[1] ?? '',
    body: match[2] ?? '',
  };
}

/**
 * Parse the YAML frontmatter into a plain object. Returns `{}` for an
 * empty block.
 *
 * @stable
 */
export function parseFrontmatter(frontmatter: string): Record<string, unknown> {
  if (frontmatter.trim().length === 0) return {};
  let parsed: unknown;
  try {
    parsed = parseYaml(frontmatter);
  } catch (err) {
    throw new SkillManifestParseError('SKILL.md frontmatter is not valid YAML.', { cause: err });
  }
  if (parsed === null || parsed === undefined) return {};
  if (typeof parsed !== 'object') {
    throw new SkillManifestParseError(
      `Top-level SKILL.md frontmatter must be an object; got '${typeof parsed}'.`,
    );
  }
  return parsed as Record<string, unknown>;
}

/**
 * Extract a `graphorin-signature:` block from the parsed frontmatter.
 * Returns `null` when no signature block is present.
 *
 * @stable
 */
export function extractSignatureBlock(
  frontmatter: Record<string, unknown>,
): SkillSignatureBlock | null {
  const raw = frontmatter['graphorin-signature'];
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== 'object') {
    throw new SkillManifestParseError('graphorin-signature must be an object.');
  }
  const block = raw as Record<string, unknown>;
  const algorithm = block.algorithm;
  if (algorithm !== 'ed25519-sha256') {
    throw new SkillManifestParseError(
      `graphorin-signature.algorithm must be 'ed25519-sha256'; got '${String(algorithm)}'.`,
    );
  }
  const publisher = requireString(block, 'publisher');
  const publishedAt = requireString(block, 'publishedAt');
  const signature = requireString(block, 'signature');
  const publicKeyRefRaw = block.publicKeyRef;
  if (
    publicKeyRefRaw === undefined ||
    typeof publicKeyRefRaw !== 'object' ||
    publicKeyRefRaw === null
  ) {
    throw new SkillManifestParseError(
      'graphorin-signature.publicKeyRef is required and must be an object.',
    );
  }
  const ref = publicKeyRefRaw as Record<string, unknown>;
  const kind = ref.kind;
  switch (kind) {
    case 'well-known': {
      const url = requireString(ref, 'url');
      return Object.freeze({
        algorithm: 'ed25519-sha256' as const,
        publisher,
        publishedAt,
        signature,
        publicKeyRef: Object.freeze({
          kind: 'well-known' as const,
          url,
          ...(typeof ref.pinFingerprint === 'string' ? { pinFingerprint: ref.pinFingerprint } : {}),
        }),
      });
    }
    case 'inline': {
      const publicKeyPem = requireString(ref, 'publicKeyPem');
      return Object.freeze({
        algorithm: 'ed25519-sha256' as const,
        publisher,
        publishedAt,
        signature,
        publicKeyRef: Object.freeze({ kind: 'inline' as const, publicKeyPem }),
      });
    }
    case 'sigstore': {
      const identity = requireString(ref, 'identity');
      const issuer = requireString(ref, 'issuer');
      return Object.freeze({
        algorithm: 'ed25519-sha256' as const,
        publisher,
        publishedAt,
        signature,
        publicKeyRef: Object.freeze({ kind: 'sigstore' as const, identity, issuer }),
      });
    }
    default:
      throw new SkillManifestParseError(
        `Unsupported graphorin-signature.publicKeyRef.kind '${String(kind)}'.`,
      );
  }
}

/**
 * Compute the canonical bytes used for ed25519 signing / verification.
 * The algorithm:
 *
 * 1. Strip the `graphorin-signature` key from the frontmatter.
 * 2. Recursively sort every object's keys.
 * 3. Stringify back to YAML using `yaml`'s deterministic emitter.
 * 4. Concatenate `frontmatter\n---\n<body>` and return the UTF-8 bytes.
 *
 * @stable
 */
export function canonicalizeForSignature(skillMd: string): {
  readonly bytes: Uint8Array;
  readonly canonicalText: string;
} {
  const { frontmatter, body } = splitFrontmatter(skillMd);
  const parsed = parseFrontmatter(frontmatter);
  delete parsed['graphorin-signature'];
  const sorted = sortKeysDeep(parsed);
  const yamlOut = stringifyYaml(sorted, { sortMapEntries: false, lineWidth: 0 }).trimEnd();
  const canonicalText = `${yamlOut}\n---\n${body.replace(/\r\n/g, '\n')}`;
  return {
    bytes: new TextEncoder().encode(canonicalText),
    canonicalText,
  };
}

function requireString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new SkillManifestParseError(`graphorin-signature.${key} must be a non-empty string.`);
  }
  return value;
}

function sortKeysDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => sortKeysDeep(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a < b ? -1 : a > b ? 1 : 0,
    );
    const out: Record<string, unknown> = {};
    for (const [k, v] of entries) {
      out[k] = sortKeysDeep(v);
    }
    return out as T;
  }
  return value;
}
