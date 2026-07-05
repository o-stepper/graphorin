/**
 * Activation surface for `@graphorin/skills`.
 *
 * Two activation paths are supported per DEC-206:
 *
 * 1. **Auto** - every step the agent runtime injects the metadata of
 *    every registered skill into the system prompt; the model elects
 *    a skill by invoking the synthetic `activate_skill(name)` tool.
 *    Skills with `disable-model-invocation: true` are excluded from
 *    the metadata advertisement so the model never sees them.
 * 2. **Slash command** - the user types `/skill:<name>` (optionally
 *    followed by free-form arguments) and the agent runtime activates
 *    the matched skill regardless of `disable-model-invocation`.
 *
 * The runtime owns the actual activation; this module only parses the
 * inputs into a structured payload.
 *
 * @packageDocumentation
 */

import { SlashCommandParseError } from '../errors/index.js';
import type { SlashCommandActivation } from '../types/index.js';

/**
 * Parse a single message body for a `/skill:<name>` invocation. The
 * grammar accepts:
 *
 * ```
 * /skill:<name>
 * /skill:<name> <free-form-args>
 * ```
 *
 * `<name>` must match `^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$` (kebab-case
 * conventional). Whitespace before the leading `/` is tolerated; any
 * other prefix triggers a {@link SlashCommandParseError}.
 *
 * @stable
 */
export function parseSlashCommand(raw: string): SlashCommandActivation {
  if (typeof raw !== 'string' || raw.length === 0) {
    throw new SlashCommandParseError(raw ?? '', 'message body must be a non-empty string.');
  }
  const trimmed = raw.replace(/^\s+/u, '');
  if (!trimmed.startsWith('/skill:')) {
    throw new SlashCommandParseError(raw, "message must begin with '/skill:'.");
  }
  const remainder = trimmed.slice('/skill:'.length);
  if (remainder.length === 0) {
    throw new SlashCommandParseError(raw, "missing skill name after '/skill:'.");
  }
  const match = /^([A-Za-z0-9][A-Za-z0-9_.-]{0,127})(?:\s+([\s\S]*))?$/u.exec(remainder);
  if (match === null) {
    throw new SlashCommandParseError(
      raw,
      'skill name must match /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/.',
    );
  }
  const name = match[1] ?? '';
  const args = (match[2] ?? '').trim();
  return Object.freeze({ name, args, raw });
}

/**
 * Convenience predicate. Returns `true` when {@link parseSlashCommand}
 * would succeed against the supplied body.
 *
 * @stable
 */
export function isSlashCommand(raw: string): boolean {
  try {
    parseSlashCommand(raw);
    return true;
  } catch {
    return false;
  }
}
