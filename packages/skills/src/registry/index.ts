/**
 * `SkillRegistry` — registry over loaded skills.
 *
 * The registry is the surface the agent runtime (Phase 12) and the
 * standalone server (Phase 14) consume. It exposes:
 *
 * - `getMetadata()` — every skill's Tier-1 metadata, used by the
 *   ContextEngine to assemble the system prompt's skill metadata
 *   block (Phase 10d).
 * - `activate(triggers)` / `getActivationRequest(triggers)` —
 *   match a list of trigger strings (slash commands and / or model-
 *   emitted skill names) and return the corresponding
 *   {@link ActivatedSkill} records.
 * - `getSkill(name)` — direct lookup.
 * - `tools()` — flat list of declared tool entries; the runtime
 *   resolves the actual `Tool[]` through the `@graphorin/tools`
 *   registry.
 *
 * @packageDocumentation
 */

import type { ResolvedTool } from '@graphorin/core';
import { parseSlashCommand } from '../activation/index.js';
import { SkillNameCollisionError, SlashCommandParseError } from '../errors/index.js';

export type { StampedSkillTool } from './bridge.js';
export { stampSkillTool, stampSkillToolFromMetadata } from './bridge.js';

import type {
  ActivatedSkill,
  InlineSkillTool,
  Skill,
  SkillMetadata,
  SkillResource,
  SkillToolDeclaration,
} from '../types/index.js';

/**
 * Stamping seam injected by the agent runtime (Phase 12). It turns a skill's
 * pre-built `Tool` into a fully resolved `ResolvedTool` (trust class + sandbox
 * tier + source). The skills package keeps no hard dependency on
 * `@graphorin/tools`; when no stamper is configured, `activate()` surfaces no
 * tools (the runtime resolves them itself).
 */
export type SkillToolStamper = (tool: InlineSkillTool, metadata: SkillMetadata) => ResolvedTool;

/** Options accepted by {@link createSkillRegistry}. */
export interface SkillRegistryOptions {
  /**
   * Default activation behaviour. When `'metadata-only'` (default),
   * `activate(...)` returns the parsed activation request without
   * invoking `Skill.body()`; callers (the agent runtime) then invoke
   * the body resolver themselves so the runtime can attach a span.
   * When `'eager'`, the registry resolves the body before returning,
   * suitable for tests.
   */
  readonly activationStrategy?: 'metadata-only' | 'eager';
  /**
   * Optional stamping function (RP-11). When supplied, `activate()` runs each
   * skill's pre-built `Tool[]` through it and surfaces the results on
   * {@link ActivatedSkill.tools}. Without it, `activate()` surfaces no tools —
   * the agent runtime resolves and stamps them itself.
   */
  readonly stampTool?: SkillToolStamper;
}

/** Public registry surface. */
export interface SkillRegistry {
  register(skill: Skill): void;
  /**
   * Upsert a skill by name (RP-11). Unlike {@link SkillRegistry.register},
   * `replace` overwrites an existing registration instead of throwing on a
   * name collision — the upgrade path for hot-reloading a re-loaded skill.
   */
  replace(skill: Skill): void;
  unregister(name: string): boolean;
  getSkill(name: string): Skill | undefined;
  has(name: string): boolean;
  list(): ReadonlyArray<Skill>;
  getMetadata(): ReadonlyArray<SkillMetadata>;
  /**
   * Skills surfaced into the system prompt for auto-activation.
   * Skills with `disable-model-invocation: true` are excluded.
   */
  getAutoActivationMetadata(): ReadonlyArray<SkillMetadata>;
  /**
   * Render the auto-activation metadata as a string suitable for the
   * system prompt. The format is bytes-stable and consumed verbatim
   * by the ContextEngine layered template (Phase 10d). Skills with
   * `disable-model-invocation: true` are excluded.
   */
  getMetadataBlock(): string;
  /**
   * Resolve a single trigger (model-emitted skill name OR the raw
   * `/skill:<name>` slash-command body) into an {@link ActivationRequest}.
   * Returns `null` when no skill matches and the trigger looked like a
   * slash command — callers that want a strict mode should call
   * {@link parseActivationTrigger} themselves.
   */
  resolveTrigger(trigger: string): ActivationRequest | null;
  activate(
    triggers: ReadonlyArray<string>,
    signal?: AbortSignal,
  ): Promise<ReadonlyArray<ActivatedSkill>>;
  /**
   * Best-effort match: returns every skill whose name OR description
   * contains all of the supplied trigger tokens (case-insensitive).
   * The agent runtime uses this when the model emits a trigger phrase
   * that does not directly map to a skill name.
   */
  search(triggers: ReadonlyArray<string>): ReadonlyArray<Skill>;
  /**
   * Flat, deduplicated list of every pre-built tool shipped by the
   * registered skills. The first registration wins on a `tool.name`
   * collision; later collisions surface a one-time WARN through the
   * console so operators can resolve the conflict (Phase 12 will
   * route these through the audit emitter).
   */
  tools(): ReadonlyArray<InlineSkillTool>;
  toolDeclarations(): ReadonlyArray<RegisteredToolDeclaration>;
  size(): number;
  clear(): void;
}

/** Activation request produced by {@link SkillRegistry.resolveTrigger}. */
export interface ActivationRequest {
  readonly skill: Skill;
  readonly activationKind: ActivatedSkill['activationKind'];
  readonly args?: string;
}

/**
 * Tool-declaration record exposed by {@link SkillRegistry.toolDeclarations}.
 * Adds the owning skill's name and trust level so downstream
 * registrations into `@graphorin/tools` can stamp the source.
 *
 * @stable
 */
export interface RegisteredToolDeclaration extends SkillToolDeclaration {
  readonly skillName: string;
  readonly trustLevel: SkillMetadata['graphorinTrustLevel'];
}

/**
 * Build a fresh, empty registry. Multiple registries can co-exist
 * within a single process; the framework defaults to a single shared
 * instance per agent instance.
 *
 * @stable
 */
export function createSkillRegistry(options: SkillRegistryOptions = {}): SkillRegistry {
  const skillsByName = new Map<string, Skill>();
  const strategy = options.activationStrategy ?? 'metadata-only';

  function register(skill: Skill): void {
    if (skillsByName.has(skill.metadata.name)) {
      throw new SkillNameCollisionError(skill.metadata.name);
    }
    skillsByName.set(skill.metadata.name, skill);
  }

  function replace(skill: Skill): void {
    skillsByName.set(skill.metadata.name, skill);
  }

  function unregister(name: string): boolean {
    return skillsByName.delete(name);
  }

  function getSkill(name: string): Skill | undefined {
    return skillsByName.get(name);
  }

  function has(name: string): boolean {
    return skillsByName.has(name);
  }

  function list(): ReadonlyArray<Skill> {
    return Object.freeze([...skillsByName.values()]);
  }

  function getMetadata(): ReadonlyArray<SkillMetadata> {
    return Object.freeze([...skillsByName.values()].map((skill) => skill.metadata));
  }

  function getAutoActivationMetadata(): ReadonlyArray<SkillMetadata> {
    return Object.freeze(
      [...skillsByName.values()]
        .map((skill) => skill.metadata)
        .filter((metadata) => !metadata.disableModelInvocation),
    );
  }

  function getMetadataBlock(): string {
    const lines: string[] = [];
    const auto = getAutoActivationMetadata();
    if (auto.length === 0) return '';
    lines.push('# Available skills');
    lines.push('');
    for (const meta of auto) {
      lines.push(`## ${meta.name}`);
      lines.push('');
      const description = meta.description.replace(/\s+/gu, ' ').trim();
      if (description.length > 0) lines.push(description);
      const cues: string[] = [];
      if (meta.allowedTools !== undefined && meta.allowedTools.length > 0) {
        cues.push(`Allowed tools: ${[...meta.allowedTools].join(', ')}`);
      }
      if (meta.graphorinSensitivity !== undefined) {
        cues.push(`Sensitivity: ${meta.graphorinSensitivity}`);
      }
      if (cues.length > 0) {
        lines.push('');
        for (const cue of cues) lines.push(`- ${cue}`);
      }
      lines.push('');
    }
    return lines.join('\n').replace(/\n+$/u, '\n');
  }

  function search(triggers: ReadonlyArray<string>): ReadonlyArray<Skill> {
    const tokens = [...triggers]
      .flatMap((trigger) => trigger.toLowerCase().split(/\s+/u))
      .filter((tok) => tok.length > 0);
    if (tokens.length === 0) return Object.freeze([]);
    const matches: Skill[] = [];
    const seen = new Set<string>();
    for (const skill of skillsByName.values()) {
      const haystack = `${skill.metadata.name}\n${skill.metadata.description}`.toLowerCase();
      const isMatch = tokens.every((tok) => haystack.includes(tok));
      if (isMatch && !seen.has(skill.metadata.name)) {
        seen.add(skill.metadata.name);
        matches.push(skill);
      }
    }
    return Object.freeze(matches);
  }

  function tools(): ReadonlyArray<InlineSkillTool> {
    const seen = new Set<string>();
    const out: InlineSkillTool[] = [];
    const collisions = new Set<string>();
    for (const skill of skillsByName.values()) {
      for (const tool of skill.tools()) {
        if (seen.has(tool.name)) {
          if (!collisions.has(tool.name)) {
            collisions.add(tool.name);
            // eslint-disable-next-line no-console
            console.warn(
              `[graphorin/skills] Duplicate tool name '${tool.name}' across skills; first registration wins.`,
            );
          }
          continue;
        }
        seen.add(tool.name);
        out.push(tool);
      }
    }
    return Object.freeze(out);
  }

  function resolveTrigger(trigger: string): ActivationRequest | null {
    const parsed = parseActivationTrigger(trigger);
    const skill = skillsByName.get(parsed.name);
    if (skill === undefined) return null;
    if (parsed.activationKind === 'auto' && skill.metadata.disableModelInvocation) {
      // Auto-activation refused — the skill opted out.
      return null;
    }
    const request: Mutable<ActivationRequest> = {
      skill,
      activationKind: parsed.activationKind,
    };
    if (parsed.args !== undefined && parsed.args.length > 0) request.args = parsed.args;
    return Object.freeze(request);
  }

  async function activate(
    triggers: ReadonlyArray<string>,
    signal?: AbortSignal,
  ): Promise<ReadonlyArray<ActivatedSkill>> {
    const out: ActivatedSkill[] = [];
    const seen = new Set<string>();
    for (const trigger of triggers) {
      const request = resolveTrigger(trigger);
      if (request === null) continue;
      if (seen.has(request.skill.metadata.name)) continue;
      seen.add(request.skill.metadata.name);
      const body = strategy === 'eager' ? await request.skill.body(signal) : '';
      const resources: ReadonlyArray<SkillResource> =
        strategy === 'eager' ? await request.skill.resources(signal) : Object.freeze([]);
      // Pre-built tools (inline source) are surfaced via `Skill.tools()`.
      // When the caller wired a `stampTool` function (the agent runtime does),
      // each tool is stamped into a `ResolvedTool` and surfaced here; without
      // it the registry exposes no tools (the runtime resolves them itself).
      const stampedTools: ReadonlyArray<ResolvedTool> =
        options.stampTool !== undefined
          ? Object.freeze(
              request.skill
                .tools()
                .map((tool) =>
                  (options.stampTool as SkillToolStamper)(tool, request.skill.metadata),
                ),
            )
          : Object.freeze([]);
      out.push(
        Object.freeze({
          skill: request.skill,
          body,
          resources,
          tools: stampedTools,
          activationKind: request.activationKind,
          activatedAt: Date.now(),
        }),
      );
    }
    return Object.freeze(out);
  }

  function toolDeclarations(): ReadonlyArray<RegisteredToolDeclaration> {
    const out: RegisteredToolDeclaration[] = [];
    for (const skill of skillsByName.values()) {
      for (const decl of skill.toolDeclarations()) {
        out.push(
          Object.freeze({
            ...decl,
            skillName: skill.metadata.name,
            trustLevel: skill.metadata.graphorinTrustLevel,
          }),
        );
      }
    }
    return Object.freeze(out);
  }

  function size(): number {
    return skillsByName.size;
  }

  function clear(): void {
    skillsByName.clear();
  }

  return Object.freeze({
    register,
    replace,
    unregister,
    getSkill,
    has,
    list,
    getMetadata,
    getAutoActivationMetadata,
    getMetadataBlock,
    resolveTrigger,
    activate,
    search,
    tools,
    toolDeclarations,
    size,
    clear,
  } satisfies SkillRegistry);
}

/**
 * Parsed activation trigger. The registry uses this to discriminate
 * slash-command activations (which override
 * `disable-model-invocation: true`) from model-emitted auto
 * activations (which honour it).
 *
 * @stable
 */
export interface ParsedActivationTrigger {
  readonly name: string;
  readonly activationKind: ActivatedSkill['activationKind'];
  readonly args?: string;
}

/**
 * Parse a single activation trigger. Slash-command bodies
 * (`/skill:<name>`) are routed through the slash parser; bare names
 * are treated as auto-activation requests emitted by the model.
 *
 * Throws {@link SlashCommandParseError} when the body looks like a
 * slash command but does not match the grammar (so the caller can
 * surface the error to the user).
 *
 * @stable
 */
export function parseActivationTrigger(raw: string): ParsedActivationTrigger {
  const trimmed = raw.trim();
  if (trimmed.startsWith('/skill:') || /^\s*\/skill:/u.test(raw)) {
    const parsed = parseSlashCommand(raw);
    return Object.freeze({
      name: parsed.name,
      activationKind: 'slash-command' as const,
      ...(parsed.args.length > 0 ? { args: parsed.args } : {}),
    });
  }
  if (trimmed.length === 0) {
    throw new SlashCommandParseError(raw, 'activation trigger must be non-empty.');
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/u.test(trimmed)) {
    throw new SlashCommandParseError(
      raw,
      'auto-activation trigger must match /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/.',
    );
  }
  return Object.freeze({
    name: trimmed,
    activationKind: 'auto' as const,
  });
}

type Mutable<T> = { -readonly [K in keyof T]: T[K] };
