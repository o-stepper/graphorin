/**
 * Active-hours window evaluation shared by the heartbeat and the
 * cron-leg: a proactive fire outside the window is skipped, so a
 * bot stays quiet at night without touching its schedule.
 *
 * The wall clock is evaluated in the window's IANA timezone via `Intl`
 * (the same zero-dependency approach as the cron timezone support in
 * `@graphorin/triggers`). Default zone: UTC - deliberately NOT the
 * process-local zone, which is arbitrary on servers; declare the
 * user's zone explicitly.
 *
 * @packageDocumentation
 */

import { isValidTimeZone } from '@graphorin/triggers';

/**
 * A daily wall-clock window in which proactive fires are allowed.
 * `from` / `to` are `'HH:MM'` (24h). A window with `from > to` crosses
 * midnight: `{ from: '22:00', to: '07:00' }` is active from 22:00
 * through 06:59. `from === to` means always active.
 *
 * @stable
 */
export interface ActiveHours {
  readonly from: string;
  readonly to: string;
  /** IANA timezone the window's wall clock lives in. Default `'UTC'`. */
  readonly timezone?: string;
}

/**
 * Validate an {@link ActiveHours} declaration eagerly. Throws
 * `TypeError` on a malformed time or an unknown timezone - at
 * construction time, never at first fire.
 */
export function validateActiveHours(hours: ActiveHours): void {
  parseWallTime(hours.from, 'from');
  parseWallTime(hours.to, 'to');
  if (hours.timezone !== undefined && !isValidTimeZone(hours.timezone)) {
    throw new TypeError(`[graphorin/proactive] activeHours: unknown timezone '${hours.timezone}'`);
  }
}

/**
 * `true` when `now` (epoch ms) falls inside the window's wall clock.
 * Pure and deterministic for a given clock value.
 *
 * @stable
 */
export function isWithinActiveHours(hours: ActiveHours, now: number): boolean {
  const from = parseWallTime(hours.from, 'from');
  const to = parseWallTime(hours.to, 'to');
  if (from === to) return true;
  const minutes = wallMinutesAt(now, hours.timezone ?? 'UTC');
  // Same-day window vs a window crossing midnight.
  return from < to ? minutes >= from && minutes < to : minutes >= from || minutes < to;
}

/** Parse `'HH:MM'` into minutes-since-midnight; throws on junk. */
function parseWallTime(value: string, field: 'from' | 'to'): number {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (match === null) {
    throw new TypeError(
      `[graphorin/proactive] activeHours.${field}: expected 'HH:MM' (24h), got '${value}'`,
    );
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

/** Wall-clock minutes-since-midnight of `now` in `timeZone`. */
function wallMinutesAt(now: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(now));
  let hour = 0;
  let minute = 0;
  for (const part of parts) {
    if (part.type === 'hour') hour = Number(part.value);
    else if (part.type === 'minute') minute = Number(part.value);
  }
  return hour * 60 + minute;
}
