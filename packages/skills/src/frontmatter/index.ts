/**
 * Frontmatter validator for `SKILL.md` files.
 *
 * Implements the field-resolution algorithm from ADR-043:
 *
 * 1. Anthropic-base (top-level, no prefix) - highest priority.
 * 2. `metadata.graphorin.<field>` bucket per upstream `metadata`
 *    convention.
 * 3. `graphorin-<field>` legacy top-level prefix.
 * 4. caller-supplied fallback.
 *
 * The validator surfaces every diagnostic through the typed
 * {@link FrontmatterDiagnostic} contract so callers can decide whether
 * to log, fail, or escalate without re-parsing human strings.
 *
 * @packageDocumentation
 */

import { parse as parseYaml } from 'yaml';

import { SkillManifestParseError } from '../errors/index.js';
import {
  compareAuthorSpecHint,
  getGraphorinMapping,
  getKnownField,
  getSpecSnapshot,
} from '../spec/index.js';
import type {
  FieldResolution,
  FrontmatterDiagnostic,
  FrontmatterValidatorPolicy,
  HandoffInputFilterDeclaration,
  HandoffInputFilterStep,
  SkillToolDeclaration,
  UnknownFieldPolicy,
} from '../types/index.js';

/** Result of {@link splitSkillMd}. */
export interface SplitSkillMd {
  readonly frontmatter: string;
  readonly body: string;
}

/**
 * Split a raw SKILL.md string into the YAML frontmatter and the
 * markdown body. The frontmatter delimiter is the canonical
 * `---\n…\n---\n` pair.
 *
 * @stable
 */
export function splitSkillMd(skillMd: string): SplitSkillMd {
  const normalized = skillMd.replace(/^\uFEFF/u, '').replace(/\r\n/g, '\n');
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/u.exec(normalized);
  if (match === null) {
    throw new SkillManifestParseError(
      'SKILL.md must begin with a YAML frontmatter block delimited by `---` lines.',
    );
  }
  return { frontmatter: match[1] ?? '', body: match[2] ?? '' };
}

/**
 * Parse the YAML frontmatter into a record. Returns `{}` for an empty
 * block.
 *
 * @stable
 */
export function parseFrontmatterYaml(frontmatter: string): Record<string, unknown> {
  if (frontmatter.trim().length === 0) return {};
  let parsed: unknown;
  try {
    parsed = parseYaml(frontmatter);
  } catch (err) {
    throw new SkillManifestParseError('SKILL.md frontmatter is not valid YAML.', { cause: err });
  }
  if (parsed === null || parsed === undefined) return {};
  if (typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new SkillManifestParseError(
      `Top-level SKILL.md frontmatter must be an object; got '${Array.isArray(parsed) ? 'array' : typeof parsed}'.`,
    );
  }
  return parsed as Record<string, unknown>;
}

/**
 * Resolve a single field across the four field-resolution tiers.
 * Returns the resolved value plus the source tier the value came from
 * AND the list of conflicting source names so the validator can
 * surface a structured diagnostic.
 *
 * @stable
 */
export function resolveSkillField<T = unknown>(
  frontmatter: Record<string, unknown>,
  field: string,
  fallback?: T,
): FieldResolution<T> {
  const conflictingSources: string[] = [];
  const presentInBase = field in frontmatter;
  const meta = frontmatter.metadata;
  const metaRecord =
    meta !== undefined && meta !== null && typeof meta === 'object' && !Array.isArray(meta)
      ? (meta as Record<string, unknown>)
      : undefined;
  // mcp-skills-09 (F-10): the docs' preferred authoring form is the
  // NESTED object (`metadata: { graphorin: { sensitivity: ... } }`),
  // which YAML parses to a nested record - the old resolver only read
  // the flat dotted key (`metadata: { 'graphorin.sensitivity': ... }`)
  // and silently dropped nested values. Both shapes now resolve; the
  // flat key wins when both are present (it was the only working form).
  const nested = metaRecord?.graphorin;
  const nestedRecord =
    nested !== undefined && nested !== null && typeof nested === 'object' && !Array.isArray(nested)
      ? (nested as Record<string, unknown>)
      : undefined;
  const presentInMetaFlat = metaRecord !== undefined && `graphorin.${field}` in metaRecord;
  const presentInMetaNested = nestedRecord !== undefined && field in nestedRecord;
  const presentInMeta = presentInMetaFlat || presentInMetaNested;
  const presentInPrefix = `graphorin-${field}` in frontmatter;
  if (presentInBase) conflictingSources.push(field);
  if (presentInMeta) conflictingSources.push(`metadata.graphorin.${field}`);
  if (presentInPrefix) conflictingSources.push(`graphorin-${field}`);
  const conflicting = conflictingSources.length > 1;

  if (presentInBase) {
    return Object.freeze({
      value: frontmatter[field] as T,
      source: 'anthropic-base' as const,
      conflicting,
      conflictingSources,
    });
  }
  if (presentInMeta) {
    return Object.freeze({
      value: (presentInMetaFlat
        ? (metaRecord as Record<string, unknown>)[`graphorin.${field}`]
        : (nestedRecord as Record<string, unknown>)[field]) as T,
      source: 'metadata-graphorin' as const,
      conflicting,
      conflictingSources,
    });
  }
  if (presentInPrefix) {
    return Object.freeze({
      value: frontmatter[`graphorin-${field}`] as T,
      source: 'graphorin-prefix' as const,
      conflicting,
      conflictingSources,
    });
  }
  return Object.freeze({
    value: fallback,
    source: 'fallback' as const,
    conflicting: false,
    conflictingSources: [],
  });
}

/**
 * Options accepted by {@link validateFrontmatter}.
 *
 * @stable
 */
export interface ValidateFrontmatterOptions {
  /** Policy for direct collisions (Anthropic-base + `graphorin-*`). */
  readonly conflictPolicy?: FrontmatterValidatorPolicy;
  /** Policy for fields not part of the bundled snapshot or `graphorin-*` catalogue. */
  readonly unknownFieldPolicy?: UnknownFieldPolicy;
  /**
   * Installed Graphorin runtime version. Used to validate
   * `graphorin-runtime-compat` declarations against the running
   * framework.
   */
  readonly runtimeVersion?: string;
}

/** Successful return of {@link validateFrontmatter}. */
export interface ValidatedFrontmatter {
  readonly raw: Readonly<Record<string, unknown>>;
  readonly diagnostics: ReadonlyArray<FrontmatterDiagnostic>;
  readonly resolved: {
    readonly name: FieldResolution<unknown>;
    readonly description: FieldResolution<unknown>;
    readonly license: FieldResolution<unknown>;
    readonly compatibility: FieldResolution<unknown>;
    readonly metadata: FieldResolution<unknown>;
    readonly allowedTools: FieldResolution<unknown>;
    readonly disableModelInvocation: FieldResolution<unknown>;
    readonly trustLevel: FieldResolution<unknown>;
    readonly runtimeCompat: FieldResolution<unknown>;
    readonly sensitivity: FieldResolution<unknown>;
    readonly sensitivityDefaults: FieldResolution<unknown>;
    readonly sandbox: FieldResolution<unknown>;
    readonly handoffInputFilter: FieldResolution<unknown>;
    readonly anthropicSpec: FieldResolution<unknown>;
    readonly version: FieldResolution<unknown>;
    readonly tools: FieldResolution<unknown>;
  };
}

/**
 * Validate a parsed frontmatter against the bundled spec snapshot and
 * the `graphorin-*` extension catalogue.
 *
 * @stable
 */
export function validateFrontmatter(
  frontmatter: Record<string, unknown>,
  options: ValidateFrontmatterOptions = {},
): ValidatedFrontmatter {
  const conflictPolicy: FrontmatterValidatorPolicy = options.conflictPolicy ?? 'warn';
  const unknownFieldPolicy: UnknownFieldPolicy = options.unknownFieldPolicy ?? 'preserve';
  const diagnostics: FrontmatterDiagnostic[] = [];

  const resolveAndDiag = <T = unknown>(field: string, fallback?: T): FieldResolution<T> => {
    const resolution = resolveSkillField<T>(frontmatter, field, fallback);
    if (resolution.conflicting) {
      const message =
        `Both '${resolution.conflictingSources.join("' and '")}' are set for '${field}'. ` +
        `The Anthropic-base / metadata.graphorin.* tier wins; remove the lower-priority field to silence this diagnostic.`;
      const hint = `Keep the highest-priority entry: '${resolution.source === 'anthropic-base' ? field : resolution.source === 'metadata-graphorin' ? `metadata.graphorin.${field}` : `graphorin-${field}`}'.`;
      const severity: 'warn' | 'error' = conflictPolicy === 'error' ? 'error' : 'warn';
      if (conflictPolicy !== 'silent') {
        diagnostics.push(
          Object.freeze({
            kind: 'conflict',
            field,
            severity,
            message,
            hint,
          }),
        );
      }
    }
    return resolution;
  };

  const name = resolveAndDiag<string>('name');
  const description = resolveAndDiag<string>('description');
  const license = resolveAndDiag<string>('license');
  const compatibility = resolveAndDiag<string>('compatibility');
  const metadata = resolveAndDiag<Record<string, unknown>>('metadata');
  const allowedTools = resolveAndDiag<unknown>('allowed-tools');
  const disableModelInvocation = resolveAndDiag<boolean>('disable-model-invocation', false);
  const trustLevel = resolveAndDiag<string>('trust-level');
  const runtimeCompat = resolveAndDiag<string>('runtime-compat');
  // The graphorin-only `version` field carries runtime-compat semantics; the
  // Anthropic-base `metadata.version` is the skill's own version. We honour
  // both - the loader uses `runtimeCompat` for compat, `version` for
  // graphorin-runtime-compat-as-version aliasing.
  const version = resolveAndDiag<string>('version');
  const sensitivity = resolveAndDiag<string>('sensitivity');
  const sensitivityDefaults = resolveAndDiag<Record<string, string>>('sensitivity-defaults');
  const sandbox = resolveAndDiag<Record<string, unknown>>('sandbox');
  const handoffInputFilter = resolveAndDiag<unknown>('handoff-input-filter');
  const anthropicSpec = resolveAndDiag<string>('anthropic-spec');
  const tools = resolveAndDiag<unknown>('tools');

  if (typeof name.value !== 'string' || name.value.trim().length === 0) {
    diagnostics.push(
      Object.freeze({
        kind: 'missing-required-field',
        field: 'name',
        severity: 'error',
        message: "Required field 'name' is missing or empty.",
        hint: "Add a unique 'name' (kebab-case is conventional) to the SKILL.md frontmatter.",
      }),
    );
  }
  if (typeof description.value !== 'string' || description.value.trim().length === 0) {
    diagnostics.push(
      Object.freeze({
        kind: 'missing-required-field',
        field: 'description',
        severity: 'error',
        message: "Required field 'description' is missing or empty.",
        hint: 'Add a description that explains when the model should activate the skill.',
      }),
    );
  }
  if (allowedTools.value !== undefined) {
    const list = parseAllowedToolsValue(allowedTools.value);
    if (list === null) {
      diagnostics.push(
        Object.freeze({
          kind: 'invalid-field-type',
          field: 'allowed-tools',
          severity: 'warn',
          message:
            "'allowed-tools' must be a string ('read_file write_file') or an array (['read_file', 'write_file']).",
          hint: 'Switch to one of the two supported shapes; entries are split on whitespace for the string form.',
        }),
      );
    }
  }
  if (
    allowedTools.value !== undefined &&
    getKnownField('allowed-tools')?.stability === 'experimental'
  ) {
    diagnostics.push(
      Object.freeze({
        kind: 'experimental-field',
        field: 'allowed-tools',
        severity: 'info',
        message:
          "'allowed-tools' is marked experimental in the bundled spec snapshot; behaviour may evolve.",
      }),
    );
  }
  if (anthropicSpec.value !== undefined && typeof anthropicSpec.value === 'string') {
    const compare = compareAuthorSpecHint(anthropicSpec.value);
    if (compare === 'newer') {
      diagnostics.push(
        Object.freeze({
          kind: 'spec-newer-than-loader',
          field: 'anthropic-spec',
          severity: 'warn',
          message: `Skill targets spec snapshot '${anthropicSpec.value}', newer than the bundled '${getSpecSnapshot().snapshotDate}'. Unknown fields will be preserved leniently.`,
        }),
      );
    } else if (compare === 'older') {
      diagnostics.push(
        Object.freeze({
          kind: 'spec-older-than-loader',
          field: 'anthropic-spec',
          severity: 'info',
          message: `Skill targets spec snapshot '${anthropicSpec.value}', older than the bundled '${getSpecSnapshot().snapshotDate}'.`,
        }),
      );
    } else if (compare === 'unparseable') {
      diagnostics.push(
        Object.freeze({
          kind: 'invalid-field-type',
          field: 'anthropic-spec',
          severity: 'warn',
          message: `'anthropic-spec' must be an ISO-8601 date string (YYYY-MM-DD); got '${String(anthropicSpec.value)}'.`,
        }),
      );
    }
  }
  if (
    runtimeCompat.value !== undefined &&
    typeof runtimeCompat.value === 'string' &&
    options.runtimeVersion !== undefined
  ) {
    if (!isRuntimeCompatSatisfied(runtimeCompat.value, options.runtimeVersion)) {
      diagnostics.push(
        Object.freeze({
          kind: 'invalid-runtime-compat',
          field: 'runtime-compat',
          severity: 'error',
          message: `Skill declares runtime-compat '${runtimeCompat.value}' which does not match installed Graphorin '${options.runtimeVersion}'.`,
          hint: 'Adjust the skill or upgrade Graphorin so the declared range covers the installed version.',
        }),
      );
    }
  }
  for (const key of Object.keys(frontmatter)) {
    if (isRecognisedField(key)) continue;
    if (key.startsWith('graphorin-')) {
      // `graphorin-*` fields not in the mapping table are tolerated as
      // opaque metadata per Phase 08 § Frontmatter validator. Emit a
      // single info-level diagnostic so loaders can surface them.
      if (unknownFieldPolicy === 'reject') {
        diagnostics.push(
          Object.freeze({
            kind: 'unknown-field',
            field: key,
            severity: 'error',
            message: `Unknown 'graphorin-*' field '${key}' rejected by unknownFieldPolicy='reject'.`,
          }),
        );
      } else if (unknownFieldPolicy === 'warn') {
        diagnostics.push(
          Object.freeze({
            kind: 'unknown-field',
            field: key,
            severity: 'warn',
            message: `Unknown 'graphorin-*' field '${key}'. Will be preserved as opaque metadata.`,
          }),
        );
      }
      continue;
    }
    if (unknownFieldPolicy === 'reject') {
      diagnostics.push(
        Object.freeze({
          kind: 'unknown-field',
          field: key,
          severity: 'error',
          message: `Unknown frontmatter field '${key}' rejected by unknownFieldPolicy='reject'.`,
        }),
      );
    } else if (unknownFieldPolicy === 'warn') {
      diagnostics.push(
        Object.freeze({
          kind: 'unknown-field',
          field: key,
          severity: 'warn',
          message: `Unknown frontmatter field '${key}'. Will be preserved as opaque metadata.`,
        }),
      );
    }
  }

  return Object.freeze({
    raw: Object.freeze({ ...frontmatter }),
    diagnostics: Object.freeze(diagnostics),
    resolved: Object.freeze({
      name,
      description,
      license,
      compatibility,
      metadata,
      allowedTools,
      disableModelInvocation,
      trustLevel,
      runtimeCompat,
      sensitivity,
      sensitivityDefaults,
      sandbox,
      handoffInputFilter,
      anthropicSpec,
      version,
      tools,
    }),
  });
}

/**
 * Parse the `allowed-tools` field. Accepts either a string (with
 * whitespace-separated entries) or a string array. Returns `null` for
 * unsupported shapes so the validator can attach a typed diagnostic.
 *
 * @stable
 */
export function parseAllowedToolsValue(value: unknown): ReadonlyArray<string> | null {
  if (Array.isArray(value)) {
    if (!value.every((entry) => typeof entry === 'string' && entry.trim().length > 0)) {
      return null;
    }
    return Object.freeze(value.map((entry) => entry.trim()) as string[]);
  }
  if (typeof value === 'string') {
    const tokens = value
      .split(/\s+/u)
      .map((tok) => tok.trim())
      .filter((tok) => tok.length > 0);
    if (tokens.length === 0) return null;
    return Object.freeze(tokens);
  }
  return null;
}

/**
 * Parse the `handoff-input-filter` field into a structured
 * declaration. Returns `null` for unsupported shapes; callers should
 * attach a diagnostic when the return value is `null` and the source
 * value was non-undefined.
 *
 * @stable
 */
export function parseHandoffInputFilter(value: unknown): HandoffInputFilterDeclaration | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === 'lastUser') return Object.freeze({ kind: 'lastUser' });
    if (trimmed === 'summary') return Object.freeze({ kind: 'summary' });
    if (trimmed === 'full') return Object.freeze({ kind: 'full' });
    const lastN = /^lastN-(\d+)$/u.exec(trimmed);
    if (lastN !== null) {
      const n = Number.parseInt(lastN[1] ?? '0', 10);
      if (Number.isFinite(n) && n > 0) return Object.freeze({ kind: 'lastN', n });
    }
    return null;
  }
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    if (Array.isArray(obj.compose)) {
      const steps: HandoffInputFilterStep[] = [];
      for (const raw of obj.compose) {
        const step = parseHandoffInputFilterStep(raw);
        if (step === null) return null;
        steps.push(step);
      }
      return Object.freeze({ kind: 'compose', steps: Object.freeze(steps) });
    }
  }
  return null;
}

function parseHandoffInputFilterStep(raw: unknown): HandoffInputFilterStep | null {
  if (typeof raw === 'string') {
    if (raw === 'lastUser') return Object.freeze({ kind: 'lastUser' });
    if (raw === 'summary') return Object.freeze({ kind: 'summary' });
    if (raw === 'stripReasoning') return Object.freeze({ kind: 'stripReasoning' });
    return null;
  }
  if (raw !== null && typeof raw === 'object' && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    if (typeof obj.lastN === 'number' && Number.isFinite(obj.lastN) && obj.lastN > 0) {
      return Object.freeze({ kind: 'lastN', n: obj.lastN });
    }
    if (
      obj.stripSensitiveOutputs !== undefined &&
      typeof obj.stripSensitiveOutputs === 'object' &&
      obj.stripSensitiveOutputs !== null
    ) {
      const inner = obj.stripSensitiveOutputs as Record<string, unknown>;
      const keepTier = typeof inner.keepTier === 'string' ? inner.keepTier : undefined;
      return Object.freeze({
        kind: 'stripSensitiveOutputs',
        ...(keepTier === undefined ? {} : { keepTier }),
      });
    }
    if (typeof obj.lastUser === 'boolean') return Object.freeze({ kind: 'lastUser' });
    if (typeof obj.summary === 'boolean') return Object.freeze({ kind: 'summary' });
    if (typeof obj.stripReasoning === 'boolean') return Object.freeze({ kind: 'stripReasoning' });
  }
  return null;
}

/**
 * Parse the `tools` field. Accepts either an array of strings (tool
 * names - the loader resolves modules through naming convention) or
 * an array of objects with `name`, `module`, `description`, `tags`.
 * Returns `null` for unsupported shapes.
 *
 * @stable
 */
export function parseToolsField(value: unknown): ReadonlyArray<SkillToolDeclaration> | null {
  if (!Array.isArray(value)) return null;
  const out: SkillToolDeclaration[] = [];
  for (const entry of value) {
    if (typeof entry === 'string') {
      if (entry.trim().length === 0) return null;
      out.push(Object.freeze({ name: entry.trim() }));
      continue;
    }
    if (entry !== null && typeof entry === 'object' && !Array.isArray(entry)) {
      const obj = entry as Record<string, unknown>;
      if (typeof obj.name !== 'string' || obj.name.trim().length === 0) return null;
      const declaration: Mutable<SkillToolDeclaration> = { name: obj.name.trim() };
      if (typeof obj.module === 'string' && obj.module.trim().length > 0)
        declaration.module = obj.module.trim();
      if (typeof obj.description === 'string') declaration.description = obj.description;
      if (Array.isArray(obj.tags) && obj.tags.every((t) => typeof t === 'string')) {
        declaration.tags = Object.freeze([...(obj.tags as string[])]);
      }
      out.push(Object.freeze(declaration as SkillToolDeclaration));
      continue;
    }
    return null;
  }
  return Object.freeze(out);
}

/**
 * Best-effort semver-range satisfaction check. Supports the patterns
 * the framework actually emits (`^x.y.z`, `~x.y.z`, `>=x.y.z`,
 * `>x.y.z`, `<=x.y.z`, `<x.y.z`, plain `x.y.z`, the AND combinator
 * with whitespace) without pulling a runtime dependency on `semver`.
 * Unrecognised inputs return `false` so the validator emits a typed
 * diagnostic.
 *
 * @stable
 */
export function isRuntimeCompatSatisfied(range: string, version: string): boolean {
  const versionTuple = parseSemver(version);
  if (versionTuple === null) return false;
  const expressions = range.split(/\s+/u).filter((seg) => seg.length > 0);
  for (const expression of expressions) {
    if (!evaluateSemverExpression(expression, versionTuple)) return false;
  }
  return true;
}

function evaluateSemverExpression(
  expression: string,
  version: readonly [number, number, number],
): boolean {
  if (expression.startsWith('^')) {
    const target = parseSemver(expression.slice(1));
    if (target === null) return false;
    if (target[0] === 0 && target[1] === 0) {
      return version[0] === 0 && version[1] === 0 && version[2] === target[2];
    }
    if (target[0] === 0) {
      return version[0] === 0 && version[1] === target[1] && cmpTuple(version, target) >= 0;
    }
    return version[0] === target[0] && cmpTuple(version, target) >= 0;
  }
  if (expression.startsWith('~')) {
    const target = parseSemver(expression.slice(1));
    if (target === null) return false;
    return version[0] === target[0] && version[1] === target[1] && cmpTuple(version, target) >= 0;
  }
  if (expression.startsWith('>=')) {
    const target = parseSemver(expression.slice(2));
    return target !== null && cmpTuple(version, target) >= 0;
  }
  if (expression.startsWith('>')) {
    const target = parseSemver(expression.slice(1));
    return target !== null && cmpTuple(version, target) > 0;
  }
  if (expression.startsWith('<=')) {
    const target = parseSemver(expression.slice(2));
    return target !== null && cmpTuple(version, target) <= 0;
  }
  if (expression.startsWith('<')) {
    const target = parseSemver(expression.slice(1));
    return target !== null && cmpTuple(version, target) < 0;
  }
  if (expression === '*') return true;
  const target = parseSemver(expression);
  return target !== null && cmpTuple(version, target) === 0;
}

function parseSemver(value: string): [number, number, number] | null {
  const trimmed = value.trim();
  // Strip optional `v` prefix and any pre-release / build metadata -
  // we only care about the canonical `MAJOR.MINOR.PATCH` triple.
  const stripped = trimmed.replace(/^v/u, '').split(/[-+]/u, 1)[0] ?? '';
  const parts = stripped.split('.');
  if (parts.length < 1 || parts.length > 3) return null;
  const [major, minor, patch] = [parts[0] ?? '0', parts[1] ?? '0', parts[2] ?? '0'];
  if (!/^\d+$/u.test(major) || !/^\d+$/u.test(minor) || !/^\d+$/u.test(patch)) return null;
  return [Number.parseInt(major, 10), Number.parseInt(minor, 10), Number.parseInt(patch, 10)];
}

function cmpTuple(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
): number {
  if (a[0] !== b[0]) return a[0] - b[0];
  if (a[1] !== b[1]) return a[1] - b[1];
  return a[2] - b[2];
}

function isRecognisedField(field: string): boolean {
  if (getKnownField(field) !== undefined) return true;
  if (getGraphorinMapping(field) !== undefined) return true;
  if (field === 'metadata') return true;
  return false;
}

type Mutable<T> = { -readonly [K in keyof T]: T[K] };
