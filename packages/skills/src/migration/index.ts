/**
 * `migrate-frontmatter` - idempotent rewrite helper that migrates
 * legacy `graphorin-*` frontmatter fields onto their upstream
 * equivalents per the `deprecate-graphorin-prefix` mappings recorded
 * in the bundled spec snapshot.
 *
 * The function is dry-run by default - callers must opt in to
 * persisting the rewritten bytes. The CLI binary in Phase 15 wraps
 * this surface; the library is exposed here so other tooling can
 * reuse it.
 *
 * @packageDocumentation
 */

import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

import { SkillManifestParseError } from '../errors/index.js';
import { splitSkillMd } from '../frontmatter/index.js';
import { getSpecSnapshot } from '../spec/index.js';

/** A single rewrite the migrator applied (or would apply in a dry-run). */
export interface MigrationRewrite {
  readonly fromField: string;
  readonly toField: string;
  readonly reason: 'deprecate-graphorin-prefix' | 'co-exist-noop' | 'graphorin-only-noop';
  readonly applied: boolean;
}

/** Result of a single SKILL.md migration. */
export interface MigrationResult {
  readonly skillId: string;
  readonly rewrites: ReadonlyArray<MigrationRewrite>;
  readonly originalSkillMd: string;
  readonly migratedSkillMd: string;
  readonly changed: boolean;
}

/** Options accepted by {@link migrateFrontmatter}. */
export interface MigrateFrontmatterOptions {
  /** Identifier used in audit / error messages. Defaults to `'<inline>'`. */
  readonly skillId?: string;
  /**
   * When `true`, rewrites are applied to the returned `migratedSkillMd`.
   * When `false` (default), `migratedSkillMd === originalSkillMd` and
   * the function operates as a dry-run report.
   */
  readonly apply?: boolean;
}

/**
 * Migrate the bundled `deprecate-graphorin-prefix` mappings on a
 * single SKILL.md. The function is idempotent: re-running it on an
 * already-migrated SKILL.md returns `changed: false` and an empty
 * `rewrites` array.
 *
 * @stable
 */
export function migrateFrontmatter(
  skillMd: string,
  options: MigrateFrontmatterOptions = {},
): MigrationResult {
  const skillId = options.skillId ?? '<inline>';
  const apply = options.apply ?? false;
  const split = splitSkillMd(skillMd);
  let frontmatter: unknown;
  try {
    frontmatter = parseYaml(split.frontmatter);
  } catch (err) {
    throw new SkillManifestParseError(`Skill '${skillId}' frontmatter is not valid YAML.`, {
      cause: err,
    });
  }
  if (frontmatter === null || typeof frontmatter !== 'object' || Array.isArray(frontmatter)) {
    throw new SkillManifestParseError(`Skill '${skillId}' frontmatter must be a top-level object.`);
  }
  const fm = { ...(frontmatter as Record<string, unknown>) };

  const snapshot = getSpecSnapshot();
  const rewrites: MigrationRewrite[] = [];
  let mutated = false;

  for (const [graphorinField, mapping] of Object.entries(snapshot.graphorinMapping)) {
    if (!(graphorinField in fm)) continue;
    if (mapping.policy !== 'deprecate-graphorin-prefix') {
      rewrites.push(
        Object.freeze({
          fromField: graphorinField,
          toField: graphorinField,
          reason: mapping.policy === 'co-exist' ? 'co-exist-noop' : 'graphorin-only-noop',
          applied: false,
        }),
      );
      continue;
    }
    if (mapping.anthropicEquivalent === null) {
      rewrites.push(
        Object.freeze({
          fromField: graphorinField,
          toField: graphorinField,
          reason: 'graphorin-only-noop',
          applied: false,
        }),
      );
      continue;
    }
    if (mapping.anthropicEquivalent in fm) {
      // Both fields are already set - the validator will surface the
      // diagnostic at load time. The migrator does not silently drop
      // either side; the operator is expected to remove the redundant
      // `graphorin-*` field manually after reviewing the diagnostic.
      rewrites.push(
        Object.freeze({
          fromField: graphorinField,
          toField: mapping.anthropicEquivalent,
          reason: 'deprecate-graphorin-prefix',
          applied: false,
        }),
      );
      continue;
    }
    if (apply) {
      fm[mapping.anthropicEquivalent] = fm[graphorinField];
      delete fm[graphorinField];
      mutated = true;
    }
    rewrites.push(
      Object.freeze({
        fromField: graphorinField,
        toField: mapping.anthropicEquivalent,
        reason: 'deprecate-graphorin-prefix',
        applied: apply,
      }),
    );
  }

  if (!apply || !mutated) {
    return Object.freeze({
      skillId,
      rewrites: Object.freeze(rewrites),
      originalSkillMd: skillMd,
      migratedSkillMd: skillMd,
      changed: false,
    });
  }

  const sortedFm = sortKeysAnthropicFirst(fm);
  const migratedFrontmatter = stringifyYaml(sortedFm, {
    sortMapEntries: false,
    lineWidth: 0,
  }).trimEnd();
  const migratedSkillMd = `---\n${migratedFrontmatter}\n---\n${split.body}`;

  return Object.freeze({
    skillId,
    rewrites: Object.freeze(rewrites),
    originalSkillMd: skillMd,
    migratedSkillMd,
    changed: true,
  });
}

/**
 * Stable key ordering: Anthropic-base fields first (in their snapshot
 * insertion order), then the `metadata` bucket, then the
 * `graphorin-*` fields, then anything else. The migrator emits in
 * this order so re-running the migrator on the same input yields
 * identical bytes (idempotence).
 *
 * @stable
 */
export function sortKeysAnthropicFirst(
  frontmatter: Record<string, unknown>,
): Record<string, unknown> {
  const snapshot = getSpecSnapshot();
  const baseKeys = Object.keys(snapshot.knownFields);
  const out: Record<string, unknown> = {};
  for (const key of baseKeys) {
    if (key in frontmatter) out[key] = frontmatter[key];
  }
  if ('metadata' in frontmatter) out.metadata = frontmatter.metadata;
  const remaining = Object.keys(frontmatter)
    .filter((k) => !(k in out))
    .sort((a, b) => {
      const aGraphorin = a.startsWith('graphorin-');
      const bGraphorin = b.startsWith('graphorin-');
      if (aGraphorin && !bGraphorin) return 1;
      if (!aGraphorin && bGraphorin) return -1;
      return a < b ? -1 : a > b ? 1 : 0;
    });
  for (const key of remaining) out[key] = frontmatter[key];
  return out;
}
