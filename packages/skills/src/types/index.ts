/**
 * Public types for `@graphorin/skills`.
 *
 * The skills loader exposes a small, stable surface that mirrors the
 * `SKILL.md` packaging format and layers Graphorin-specific
 * extensions on top through the `graphorin-*` namespace.
 *
 * @packageDocumentation
 */

import type { ResolvedTool, Tool } from '@graphorin/core';
import type {
  ResolvedSkillTrustPolicy,
  SkillSignatureVerificationResult,
  SkillTrustLevel,
  SkillSource as SupplyChainSkillSource,
} from '@graphorin/security/supply-chain';

/**
 * Trust level recognised by the skills loader. Extends the
 * supply-chain trust ladder with a third `'unknown'` value the
 * loader uses for skills that have no explicit declaration. The
 * sandbox tier resolver treats `'unknown'` like `'untrusted'`
 * (mandatory `worker-threads + no-net + no-fs`); the supply-chain
 * installer treats it as untrusted EXCEPT that the signature
 * requirement is downgraded from mandatory to optional - signature
 * is a trust upgrade, not a gate (Phase 08 § Risks & mitigations).
 *
 * @stable
 */
export type SkillsTrustLevel = SkillTrustLevel | 'unknown';

/**
 * Conflict-resolution policy used by the frontmatter validator when an
 * Anthropic-base field and the equivalent `graphorin-*` field are both
 * declared.
 *
 * @stable
 */
export type FrontmatterValidatorPolicy = 'warn' | 'error' | 'silent';

/**
 * Policy applied to frontmatter fields that are present but recognised
 * neither by the bundled spec snapshot nor by the `graphorin-*`
 * extension catalogue.
 *
 * @stable
 */
export type UnknownFieldPolicy = 'preserve' | 'reject' | 'warn';

/**
 * Trust level applied to a loaded skill. Mirrors the supply-chain
 * trust ladder + the loader's `'unknown'` extension so callers do
 * not have to bridge two enums.
 *
 * @stable
 */
export type SkillTrustLevelValue = SkillsTrustLevel;

/**
 * Source descriptor for a {@link loadSkills} request.
 *
 * - `'folder'`      - load from a directory on disk.
 * - `'npm-package'` - install via the supply-chain installer + load.
 * - `'git-repo'`    - shallow-clone via the supply-chain installer +
 *   load.
 * - `'inline'`      - the caller supplies a parsed skill structure;
 *   useful for tests and embedded fixtures.
 *
 * @stable
 */
export type SkillSource =
  | {
      readonly kind: 'folder';
      readonly path: string;
      /**
       * Operator-supplied trust level. When present it overrides the
       * skill's self-declared `graphorin-trust-level`. Without it, a
       * folder's self-declared `trusted` / `trusted-with-scripts` is
       * capped at `'unknown'` - a downloaded directory cannot promote
       * itself; trust is granted by the integrator, never the artifact.
       */
      readonly trustLevel?: SkillTrustLevel;
    }
  | {
      readonly kind: 'npm-package';
      readonly packageName: string;
      readonly version?: string;
      readonly trustLevel?: SkillTrustLevel;
    }
  | {
      readonly kind: 'git-repo';
      readonly url: string;
      readonly ref?: string;
      readonly trustLevel?: SkillTrustLevel;
    }
  | { readonly kind: 'inline'; readonly skill: InlineSkill };

/**
 * Pre-built tool record accepted by the inline source. The loader
 * does not parse the tool - it forwards the record to the agent
 * runtime which feeds it through `stampSkillTool(...)` before
 * registering with `@graphorin/tools`.
 *
 * @stable
 */
export type InlineSkillTool = Tool;

/**
 * Pre-built skill payload accepted by `{ kind: 'inline' }`. Bypasses
 * the file-system loader; useful for tests and bundled defaults.
 *
 * @stable
 */
export interface InlineSkill {
  readonly skillMd: string;
  readonly basePath?: string;
  readonly resources?: ReadonlyArray<{ readonly path: string; readonly content: string }>;
  /**
   * Pre-built `Tool[]` payload. When supplied, the loader exposes
   * these via {@link Skill.tools} so {@link SkillRegistry.tools}
   * returns them deduplicated by `tool.name`.
   *
   * Folder / npm / git sources do not carry tool implementations -
   * the agent runtime (Phase 12) materialises them from the skill's
   * `tools/` directory. The inline source is the only path through
   * which tests + bundled defaults can ship pre-built tools.
   */
  readonly tools?: ReadonlyArray<InlineSkillTool>;
}

/**
 * Resolution outcome of a single field on a `SKILL.md` frontmatter.
 *
 * @stable
 */
export interface FieldResolution<T = unknown> {
  readonly value: T | undefined;
  readonly source: 'anthropic-base' | 'metadata-graphorin' | 'graphorin-prefix' | 'fallback';
  readonly conflicting: boolean;
  readonly conflictingSources: ReadonlyArray<string>;
}

/**
 * Diagnostic record produced by the frontmatter validator. Carries a
 * structured `kind` so the loader can surface the diagnostic on a
 * trace span / audit emitter without re-parsing the human message.
 *
 * @stable
 */
export interface FrontmatterDiagnostic {
  readonly kind:
    | 'conflict'
    | 'experimental-field'
    | 'unknown-field'
    | 'spec-newer-than-loader'
    | 'spec-older-than-loader'
    | 'unsupported-frontmatter'
    | 'invalid-field-type'
    | 'missing-required-field'
    | 'untrusted-handoff-filter-required'
    | 'invalid-runtime-compat';
  readonly field: string;
  readonly severity: 'info' | 'warn' | 'error';
  readonly message: string;
  readonly hint?: string;
}

/**
 * Validated skill metadata. Always available on the registry without
 * loading the body - this is the always-present **Tier 1** payload
 * that the system prompt advertises.
 *
 * @stable
 */
export interface SkillMetadata {
  readonly name: string;
  readonly description: string;
  readonly license?: string;
  readonly compatibility?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly allowedTools?: ReadonlyArray<string>;
  readonly disableModelInvocation: boolean;
  readonly graphorinTrustLevel: SkillsTrustLevel;
  readonly graphorinRuntimeCompat?: string;
  readonly graphorinSensitivity?: string;
  readonly graphorinSensitivityDefaults?: Readonly<Record<string, string>>;
  readonly graphorinSandbox?: Readonly<Record<string, unknown>>;
  readonly graphorinHandoffInputFilter?: HandoffInputFilterDeclaration;
  readonly graphorinSignaturePresent: boolean;
  readonly graphorinAnthropicSpec?: string;
  /** Author-declared graphorin runtime / extension version. */
  readonly graphorinVersion?: string;
  /** Raw frontmatter (read-only) for power users - every loader user can re-derive bespoke fields. */
  readonly raw: Readonly<Record<string, unknown>>;
}

/**
 * `graphorin-handoff-input-filter` declaration recognised by the
 * loader. The runtime resolves the declaration into the actual filter
 * implementation in Phase 12; the loader only validates the shape.
 *
 * @stable
 */
export type HandoffInputFilterDeclaration =
  | { readonly kind: 'lastUser' }
  | { readonly kind: 'lastN'; readonly n: number }
  | { readonly kind: 'summary' }
  | { readonly kind: 'full' }
  | {
      readonly kind: 'compose';
      readonly steps: ReadonlyArray<HandoffInputFilterStep>;
    };

/**
 * Composable step recognised inside `graphorin-handoff-input-filter:
 * { compose: [...] }`. The runtime resolves named steps into actual
 * filter implementations in Phase 12.
 *
 * @stable
 */
export type HandoffInputFilterStep =
  | { readonly kind: 'lastUser' }
  | { readonly kind: 'lastN'; readonly n: number }
  | { readonly kind: 'summary' }
  | {
      readonly kind: 'stripSensitiveOutputs';
      readonly keepTier?: string;
    }
  | { readonly kind: 'stripReasoning' };

/**
 * Tool declaration found inside `graphorin-tools:`. The loader only
 * captures the declarations; the actual `Tool[]` is produced by the
 * skill author's `tools/*.ts` modules and bridged into the
 * `@graphorin/tools` registry by the agent runtime in Phase 12.
 *
 * @stable
 */
export interface SkillToolDeclaration {
  readonly name: string;
  readonly module?: string;
  readonly description?: string;
  readonly tags?: ReadonlyArray<string>;
}

/**
 * Lazy resource accessor returned by {@link Skill.resources}. The
 * loader does not read the file off disk until `.read()` is invoked.
 *
 * @stable
 */
export interface SkillResource {
  readonly path: string;
  readonly relativePath: string;
  readonly mediaType?: string;
  read(signal?: AbortSignal): Promise<Uint8Array>;
  readText(signal?: AbortSignal): Promise<string>;
}

/**
 * Loaded skill record returned by {@link SkillRegistry.getSkill} and
 * {@link loadSkills}. Three-tier semantics:
 *
 * - {@link Skill.metadata} - always available (parsed at load time).
 * - {@link Skill.body}     - lazy; resolved on first call. Cached for
 *   subsequent calls.
 * - {@link Skill.resources} - lazy listing; resource bytes are only
 *   read when {@link SkillResource.read} is invoked.
 * - {@link Skill.tools}    - derived from the `graphorin-tools`
 *   declarations; the actual `Tool[]` is materialised by the agent
 *   runtime through the `@graphorin/tools` registry.
 *
 * @stable
 */
export interface Skill {
  readonly metadata: SkillMetadata;
  readonly source: SkillSource;
  readonly basePath?: string;
  readonly trustPolicy: ResolvedSkillTrustPolicy;
  readonly signature?: SkillSignatureVerificationResult;
  body(signal?: AbortSignal): Promise<string>;
  resources(signal?: AbortSignal): Promise<ReadonlyArray<SkillResource>>;
  /**
   * Pre-built tools shipped with the skill. The inline source is the
   * only path through which the loader carries actual `Tool[]`
   * records; folder / npm / git sources return `[]` here and the
   * agent runtime (Phase 12) materialises tools from the
   * `graphorin-tools` declarations + the skill's `tools/` directory.
   */
  tools(): ReadonlyArray<InlineSkillTool>;
  toolDeclarations(): ReadonlyArray<SkillToolDeclaration>;
  diagnostics(): ReadonlyArray<FrontmatterDiagnostic>;
}

/**
 * Activated skill - what the agent runtime sees after the model (or a
 * slash command) elects a skill. Carries the loaded body + declared
 * tools so the runtime can inject them into the conversation.
 *
 * @stable
 */
export interface ActivatedSkill {
  readonly skill: Skill;
  readonly body: string;
  readonly resources: ReadonlyArray<SkillResource>;
  /**
   * Tools made available to the model while the skill is active.
   * The agent runtime (Phase 12) is the canonical producer - it
   * resolves the skill's `tools/` directory or the inline-supplied
   * `Tool[]` and feeds each entry through `stampSkillTool(...)` so
   * the resulting `ResolvedTool` carries the right trust class +
   * sandbox tier.
   */
  readonly tools: ReadonlyArray<ResolvedTool>;
  readonly activationKind: 'auto' | 'slash-command' | 'explicit';
  readonly activatedAt: number;
}

/**
 * Result of {@link parseSlashCommand}. The loader parses
 * `/skill:<name>` and `/skill:<name> <free-form-args>` into a
 * structured payload the agent runtime consumes.
 *
 * @stable
 */
export interface SlashCommandActivation {
  readonly name: string;
  readonly args: string;
  readonly raw: string;
}

export type {
  ResolvedSkillTrustPolicy,
  SkillSignatureVerificationResult,
  SkillTrustLevel,
  SupplyChainSkillSource,
};
