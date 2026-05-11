/**
 * Typed error hierarchy for `@graphorin/skills`.
 *
 * Every error carries a stable lowercase `kind` discriminator so the
 * agent runtime, the CLI, and the audit emitter can branch without
 * resorting to `instanceof` chains, plus an optional `hint` field with
 * an actionable remediation step (a CLI command or a documentation
 * link).
 *
 * @packageDocumentation
 */

/** Base class for every error thrown by `@graphorin/skills`. */
export abstract class GraphorinSkillsError extends Error {
  abstract readonly kind: string;
  readonly hint?: string;
  override readonly cause?: unknown;
  constructor(message: string, options?: { hint?: string; cause?: unknown }) {
    super(message);
    this.name = new.target.name;
    if (options?.hint !== undefined) this.hint = options.hint;
    if (options?.cause !== undefined) this.cause = options.cause;
  }
}

/**
 * The frontmatter validator detected an Anthropic-base / `graphorin-*`
 * collision and the operator-resolved policy is `'error'`.
 */
export class SkillFrontmatterConflictError extends GraphorinSkillsError {
  readonly kind = 'frontmatter:conflict' as const;
  readonly skillName: string;
  readonly field: string;
  readonly conflictingFields: ReadonlyArray<string>;
  constructor(
    skillName: string,
    field: string,
    conflictingFields: ReadonlyArray<string>,
    options?: { hint?: string },
  ) {
    super(
      `Skill '${skillName}' frontmatter conflict on '${field}' (also set: ${conflictingFields
        .filter((f) => f !== field)
        .join(', ')}). Validator policy: 'error'.`,
      options,
    );
    this.skillName = skillName;
    this.field = field;
    this.conflictingFields = conflictingFields;
  }
}

/** A skill manifest could not be parsed (missing frontmatter / invalid YAML). */
export class SkillManifestParseError extends GraphorinSkillsError {
  readonly kind = 'manifest:parse' as const;
}

/**
 * The runtime-compat declaration on a skill does not satisfy the
 * loader's installed runtime version.
 */
export class SkillRuntimeCompatError extends GraphorinSkillsError {
  readonly kind = 'runtime-compat:mismatch' as const;
  readonly skillName: string;
  readonly declared: string;
  readonly installed: string;
  constructor(skillName: string, declared: string, installed: string, options?: { hint?: string }) {
    super(
      `Skill '${skillName}' declares runtime-compat '${declared}' which does not match installed Graphorin '${installed}'.`,
      options,
    );
    this.skillName = skillName;
    this.declared = declared;
    this.installed = installed;
  }
}

/** A required Anthropic-base field is missing from the frontmatter. */
export class SkillRequiredFieldMissingError extends GraphorinSkillsError {
  readonly kind = 'frontmatter:missing-required' as const;
  readonly field: string;
  constructor(field: string, options?: { hint?: string }) {
    super(`Skill frontmatter is missing required field '${field}'.`, options);
    this.field = field;
  }
}

/**
 * `Agent.toTool()` / `handoff(...)` would be invoked inside an
 * untrusted skill, but the skill did not declare
 * `graphorin-handoff-input-filter`. Throwing the error at activation
 * time prevents the runtime from materialising a sub-agent without an
 * explicit filter.
 */
export class InputFilterRequiredError extends GraphorinSkillsError {
  readonly kind = 'handoff:input-filter-required' as const;
  readonly skillName: string;
  constructor(skillName: string, options?: { hint?: string; cause?: unknown }) {
    super(
      `Untrusted skill '${skillName}' uses Agent.toTool()/handoff() but did not declare 'graphorin-handoff-input-filter'.`,
      {
        hint:
          options?.hint ??
          "Add 'graphorin-handoff-input-filter: lastUser' (or another supported value) to the SKILL.md frontmatter.",
        ...(options?.cause === undefined ? {} : { cause: options.cause }),
      },
    );
    this.skillName = skillName;
  }
}

/** A skill source could not be loaded from disk. */
export class SkillLoadError extends GraphorinSkillsError {
  readonly kind = 'load:failed' as const;
  readonly source: string;
  constructor(source: string, message: string, options?: { hint?: string; cause?: unknown }) {
    super(`Skill load failed (source='${source}'): ${message}`, options);
    this.source = source;
  }
}

/** A skill name in a registry registration collided with another already-loaded skill. */
export class SkillNameCollisionError extends GraphorinSkillsError {
  readonly kind = 'registry:name-collision' as const;
  readonly skillName: string;
  constructor(skillName: string, options?: { hint?: string; cause?: unknown }) {
    super(`Skill '${skillName}' is already registered.`, {
      hint:
        options?.hint ??
        'Either rename one of the colliding skills or call `registry.unregister(name)` before re-registering.',
      ...(options?.cause === undefined ? {} : { cause: options.cause }),
    });
    this.skillName = skillName;
  }
}

/**
 * The slash-command parser received a string that did not match the
 * `/skill:<name>` grammar.
 */
export class SlashCommandParseError extends GraphorinSkillsError {
  readonly kind = 'slash:parse' as const;
  readonly raw: string;
  constructor(raw: string, message: string, options?: { hint?: string; cause?: unknown }) {
    super(`Slash command '${raw}': ${message}`, {
      hint: options?.hint ?? 'Use `/skill:<name>` to activate a registered skill.',
      ...(options?.cause === undefined ? {} : { cause: options.cause }),
    });
    this.raw = raw;
  }
}

/** Convenience union — every `kind` discriminator the package may emit. */
export type GraphorinSkillsErrorKind =
  | 'frontmatter:conflict'
  | 'manifest:parse'
  | 'runtime-compat:mismatch'
  | 'frontmatter:missing-required'
  | 'handoff:input-filter-required'
  | 'load:failed'
  | 'registry:name-collision'
  | 'slash:parse';
