/**
 * `@graphorin/skills` — skills surface for the Graphorin framework.
 *
 * The package owns:
 *
 * - `SKILL.md` loader with three-tier progressive disclosure
 *   (metadata always available; body and resources lazy-loaded).
 * - Frontmatter validator implementing the field-resolution
 *   algorithm and conflict policy from ADR-043.
 * - Bundled snapshot of the publicly published `SKILL.md` packaging-
 *   format specification + the framework-specific extension
 *   catalogue.
 * - Slash-command parser (`/skill:<name>`) + auto-activation
 *   metadata generator.
 * - `SkillRegistry` with name-collision detection, activation
 *   resolution, and a typed tool-declaration surface the agent
 *   runtime bridges into the `@graphorin/tools` registry.
 * - Idempotent `migrateFrontmatter` library that rewrites legacy
 *   `graphorin-*` fields onto their upstream equivalents per the
 *   bundled mapping table.
 *
 * Stable sub-paths:
 *
 * ```ts
 * import { loadSkills, loadSkillFromSource } from '@graphorin/skills/loader';
 * import { createSkillRegistry } from '@graphorin/skills/registry';
 * import { validateFrontmatter, resolveSkillField } from '@graphorin/skills/frontmatter';
 * import { migrateFrontmatter } from '@graphorin/skills/migration';
 * import { parseSlashCommand } from '@graphorin/skills/activation';
 * import { getSpecSnapshot, getKnownField } from '@graphorin/skills/spec';
 * import { SkillFrontmatterConflictError } from '@graphorin/skills/errors';
 * ```
 *
 * @packageDocumentation
 */

/** Canonical version constant. Mirrors the `package.json` version. */
export const VERSION = '0.5.0';

export * from './activation/index.js';
export * from './errors/index.js';
export * from './frontmatter/index.js';
export * from './loader/index.js';
export * from './migration/index.js';
export * from './registry/index.js';
export * from './spec/index.js';
export * from './types/index.js';
