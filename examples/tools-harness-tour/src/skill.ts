/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Skills stage of the tour: load the bundled `offline-notes` skill folder
 * (`assets/skills/offline-notes/SKILL.md`) with the `@graphorin/skills`
 * loader, then materialise the tool it DECLARES in frontmatter
 * (`graphorin-tools: [{ name: note_lookup, ... }]`).
 *
 * Division of labour (mirrors the agent runtime): the loader parses and
 * validates frontmatter and carries tool DECLARATIONS only; the caller
 * supplies the actual `Tool` implementation and runs it through
 * `stampSkillTool(...)`, which derives the `skill` ToolSource, forces the
 * sandbox tier for untrusted skills, and defaults the inbound-sanitization
 * policy to `'detect-and-strip-and-wrap'`.
 */

import { fileURLToPath } from 'node:url';

import {
  loadSkillFromSource,
  type Skill,
  type StampedSkillTool,
  stampSkillTool,
} from '@graphorin/skills';
import { tool } from '@graphorin/tools';
import { z } from 'zod';

/** Topics the bundled `note_lookup` tool can answer. */
export const NOTE_TOPICS = ['tool-search', 'read-result', 'spill'] as const;

type NoteTopic = (typeof NOTE_TOPICS)[number];

const HARNESS_NOTES: Readonly<Record<NoteTopic, string>> = Object.freeze({
  'tool-search':
    'tool_search ranks the deferred pool (semantic, then BM25, then name-regex) and returns matching tool cards.',
  'read-result':
    'read_result pages a spilled artifact back by byte or line range, confined to the spill root.',
  spill:
    'spill handles are run-scoped: the artifact lives under <root>/<runId>/ and cross-run reads are denied by default.',
});

/** What the skills stage hands back to the tour. */
export interface LoadedOfflineNotesSkill {
  readonly skill: Skill;
  /** The materialised `note_lookup` tool, stamped with the skill source. */
  readonly stamped: StampedSkillTool<{ topic: NoteTopic }, { topic: string; note: string }>;
}

/** Absolute path of the bundled skill folder (works from src/ and dist/). */
export function offlineNotesSkillDir(): string {
  return fileURLToPath(new URL('../assets/skills/offline-notes', import.meta.url));
}

/**
 * Load the bundled skill and materialise its declared tool.
 */
export async function loadOfflineNotesSkill(): Promise<LoadedOfflineNotesSkill> {
  const skill = await loadSkillFromSource({ kind: 'folder', path: offlineNotesSkillDir() });

  const declaration = skill.toolDeclarations().find((d) => d.name === 'note_lookup');
  if (declaration === undefined) {
    throw new Error("offline-notes SKILL.md no longer declares the 'note_lookup' tool.");
  }

  const noteLookup = tool<{ topic: NoteTopic }, { topic: string; note: string }>({
    name: declaration.name,
    description: declaration.description ?? 'Return the bundled harness release note for a topic.',
    inputSchema: z.object({ topic: z.enum(NOTE_TOPICS) }),
    outputSchema: z.object({ topic: z.string(), note: z.string() }),
    sideEffectClass: 'pure',
    ...(declaration.tags === undefined ? {} : { tags: declaration.tags }),
    async execute(input) {
      return { topic: input.topic, note: HARNESS_NOTES[input.topic] };
    },
  });

  // The skill self-declares `untrusted`, so the stamp forces the sandbox
  // tier and the strip-and-wrap inbound policy onto the tool.
  const stamped = stampSkillTool(noteLookup, skill);
  return { skill, stamped };
}
