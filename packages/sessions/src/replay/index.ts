/**
 * Barrel for the session-level replay surface.
 *
 * @packageDocumentation
 */

export type {
  CreateSessionReplayerOptions,
  SessionReplayer,
} from './replayer.js';
export { createSessionReplayer } from './replayer.js';
export type {
  ReplayActor,
  SessionReplayEvent,
  SessionReplayMode,
  SessionReplayOptions,
} from './types.js';
