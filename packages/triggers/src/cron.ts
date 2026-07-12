/**
 * Tiny in-tree 5-field cron parser used by `@graphorin/triggers`.
 *
 * Supported syntax:
 *
 *   minute   (0-59)
 *   hour     (0-23)
 *   day      (1-31)
 *   month    (1-12)
 *   dayOfWeek (0-6; Sunday = 0)
 *
 * Each field accepts:
 *   - star (asterisk) for every value
 *   - a single number `5`
 *   - a comma list `1,2,5`
 *   - a range `1-4`
 *   - a step expression with the slash operator (e.g. every-5 minutes,
 *     `0-30/10` for "0,10,20,30 minutes")
 *
 * The parser is intentionally **strict**: any unrecognised character
 * raises {@link CronParseError} so a typo never silently never-fires.
 *
 * **Day vs. day-of-week semantics - AND, not OR.** When *both* `day`
 * and `dayOfWeek` are restricted (neither is the every-value
 * wildcard), Graphorin requires **both** to match for a fire to
 * happen - i.e. `0 12 1-7 * 1` means "noon on the first Monday of
 * every month". This differs from Vixie / POSIX cron, which
 * OR-combines the two restricted fields. AND semantics are easier to
 * reason about in personal-assistant scenarios; the framework stays
 * consistent with this rule rather than mixing the two conventions.
 *
 * **Timezones (W-124).** By default the scheduler evaluates every
 * expression in **UTC**. `nextFireAfter(parsed, from, timeZone)`
 * accepts an optional IANA zone name; the five fields then match the
 * wall clock of that zone and the returned `Date` is the corresponding
 * UTC instant. DST transitions follow Vixie cron semantics:
 *
 * - **Fixed-time jobs** (neither the minute nor the hour field covers
 *   its full range): a wall time swallowed by a spring-forward gap
 *   runs once immediately after the transition; a wall time repeated
 *   by a fall-back overlap runs only on the first pass.
 * - **Wildcard jobs** (the minute or the hour field covers its full
 *   range, e.g. `*` or `0-59`): no compensation - the job simply
 *   follows the new wall clock, so gap times never run and repeated
 *   times run on both passes.
 *
 * @packageDocumentation
 */

/** @stable */
export class CronParseError extends Error {
  override readonly name = 'CronParseError';
  constructor(
    public readonly expression: string,
    message: string,
  ) {
    super(`[graphorin/triggers] cron expression '${expression}': ${message}`);
  }
}

/** @stable */
export interface ParsedCron {
  readonly expression: string;
  readonly minute: ReadonlySet<number>;
  readonly hour: ReadonlySet<number>;
  readonly day: ReadonlySet<number>;
  readonly month: ReadonlySet<number>;
  readonly dayOfWeek: ReadonlySet<number>;
}

interface FieldRange {
  readonly min: number;
  readonly max: number;
}

const RANGES: Readonly<Record<keyof Omit<ParsedCron, 'expression'>, FieldRange>> = {
  minute: { min: 0, max: 59 },
  hour: { min: 0, max: 23 },
  day: { min: 1, max: 31 },
  month: { min: 1, max: 12 },
  dayOfWeek: { min: 0, max: 6 },
};

/**
 * Parse a 5-field cron expression. Throws {@link CronParseError} on
 * any malformed input.
 *
 * @stable
 */
export function parseCron(expression: string): ParsedCron {
  const trimmed = expression.trim();
  if (trimmed.length === 0) {
    throw new CronParseError(expression, 'expression is empty');
  }
  const fields = trimmed.split(/\s+/);
  if (fields.length !== 5) {
    throw new CronParseError(
      expression,
      `expected 5 whitespace-separated fields (minute hour day month dayOfWeek), got ${fields.length}`,
    );
  }
  const [minuteStr, hourStr, dayStr, monthStr, dowStr] = fields as [
    string,
    string,
    string,
    string,
    string,
  ];
  return {
    expression: trimmed,
    minute: parseField('minute', minuteStr, RANGES.minute, expression),
    hour: parseField('hour', hourStr, RANGES.hour, expression),
    day: parseField('day', dayStr, RANGES.day, expression),
    month: parseField('month', monthStr, RANGES.month, expression),
    dayOfWeek: parseField('dayOfWeek', dowStr, RANGES.dayOfWeek, expression),
  };
}

function parseField(
  name: string,
  raw: string,
  range: FieldRange,
  expression: string,
): ReadonlySet<number> {
  const out = new Set<number>();
  for (const part of raw.split(',')) {
    if (part.length === 0) {
      throw new CronParseError(expression, `field '${name}' has an empty list element`);
    }
    let stepStr: string | undefined;
    let bodyStr = part;
    if (part.includes('/')) {
      const [body, step] = part.split('/', 2);
      bodyStr = body ?? '';
      stepStr = step;
    }
    const step = stepStr === undefined ? 1 : Number.parseInt(stepStr, 10);
    if (!Number.isFinite(step) || step <= 0) {
      throw new CronParseError(expression, `field '${name}' has invalid step '${stepStr}'`);
    }
    let from: number;
    let to: number;
    if (bodyStr === '*') {
      from = range.min;
      to = range.max;
    } else if (bodyStr.includes('-')) {
      const [a, b] = bodyStr.split('-', 2);
      from = parseNumeric(name, a, expression);
      to = parseNumeric(name, b, expression);
    } else {
      const single = parseNumeric(name, bodyStr, expression);
      from = single;
      to = stepStr === undefined ? single : range.max;
    }
    if (from < range.min || to > range.max || from > to) {
      throw new CronParseError(
        expression,
        `field '${name}' value out of range [${range.min}, ${range.max}]: ${bodyStr}`,
      );
    }
    for (let v = from; v <= to; v += step) {
      out.add(v);
    }
  }
  return out;
}

function parseNumeric(name: string, raw: string | undefined, expression: string): number {
  if (raw === undefined || raw.length === 0) {
    throw new CronParseError(expression, `field '${name}' has empty numeric component`);
  }
  if (!/^\d+$/.test(raw)) {
    throw new CronParseError(expression, `field '${name}' value '${raw}' is not numeric`);
  }
  return Number.parseInt(raw, 10);
}

/**
 * Compute the next fire time strictly after `from` for the supplied
 * cron schedule. Returns a UTC `Date`.
 *
 * Without `timeZone` the expression is evaluated in **UTC** (the
 * historical default). With an IANA `timeZone` the fields match the
 * wall clock of that zone; DST transitions follow Vixie cron
 * semantics (see the module doc, W-124).
 *
 * Returns `null` if no fire happens in the next 4 years (defensive -
 * impossible for a well-formed cron expression except a vacuous
 * combination that never aligns).
 *
 * @stable
 */
export function nextFireAfter(parsed: ParsedCron, from: Date, timeZone?: string): Date | null {
  if (timeZone !== undefined && timeZone !== 'UTC') {
    return nextFireAfterInZone(parsed, from.getTime(), timeZone);
  }
  const start = new Date(from.getTime() + 60_000);
  start.setUTCSeconds(0, 0);
  const horizon = new Date(start.getTime() + 4 * 365 * 24 * 60 * 60 * 1000);

  let cursor = new Date(start.getTime());
  while (cursor.getTime() < horizon.getTime()) {
    const month = cursor.getUTCMonth() + 1;
    if (!parsed.month.has(month)) {
      cursor = new Date(
        Date.UTC(
          cursor.getUTCMonth() === 11 ? cursor.getUTCFullYear() + 1 : cursor.getUTCFullYear(),
          (cursor.getUTCMonth() + 1) % 12,
          1,
          0,
          0,
          0,
          0,
        ),
      );
      continue;
    }
    const day = cursor.getUTCDate();
    const dow = cursor.getUTCDay();
    if (!parsed.day.has(day) || !parsed.dayOfWeek.has(dow)) {
      cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
      cursor.setUTCHours(0, 0, 0, 0);
      continue;
    }
    if (!parsed.hour.has(cursor.getUTCHours())) {
      cursor = new Date(cursor.getTime() + 60 * 60 * 1000);
      cursor.setUTCMinutes(0, 0, 0);
      continue;
    }
    if (!parsed.minute.has(cursor.getUTCMinutes())) {
      cursor = new Date(cursor.getTime() + 60_000);
      cursor.setUTCSeconds(0, 0);
      continue;
    }
    return cursor;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Timezone-aware evaluation (W-124)
// ---------------------------------------------------------------------------

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Formatter cache - `Intl.DateTimeFormat` construction is expensive. */
const ZONE_FORMATTERS = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  const cached = ZONE_FORMATTERS.get(timeZone);
  if (cached !== undefined) return cached;
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  ZONE_FORMATTERS.set(timeZone, formatter);
  return formatter;
}

/**
 * `true` when `timeZone` is an IANA zone name this runtime's Intl data
 * resolves. The `cron(...)` helper uses it for eager validation so a
 * typo fails at registration time, never at first fire.
 *
 * @stable
 */
export function isValidTimeZone(timeZone: string): boolean {
  try {
    formatterFor(timeZone);
    return true;
  } catch {
    return false;
  }
}

interface WallParts {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
}

function wallPartsAt(utcMs: number, timeZone: string): WallParts {
  const parts = formatterFor(timeZone).formatToParts(new Date(utcMs));
  let year = 0;
  let month = 0;
  let day = 0;
  let hour = 0;
  let minute = 0;
  for (const part of parts) {
    switch (part.type) {
      case 'year':
        year = Number.parseInt(part.value, 10);
        break;
      case 'month':
        month = Number.parseInt(part.value, 10);
        break;
      case 'day':
        day = Number.parseInt(part.value, 10);
        break;
      case 'hour':
        hour = Number.parseInt(part.value, 10);
        break;
      case 'minute':
        minute = Number.parseInt(part.value, 10);
        break;
      default:
        break;
    }
  }
  return { year, month, day, hour, minute };
}

/**
 * Offset (ms) of `timeZone` from UTC at the UTC instant `utcMs`.
 * Minute-aligned - every real-world offset in the modern IANA era is.
 */
function offsetAt(utcMs: number, timeZone: string): number {
  const w = wallPartsAt(utcMs, timeZone);
  const wallMs = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute);
  const alignedUtc = Math.floor(utcMs / MINUTE_MS) * MINUTE_MS;
  return wallMs - alignedUtc;
}

/**
 * UTC instants (ascending) whose wall clock in `timeZone` reads exactly
 * the minute encoded by `wallMs` (wall fields interpreted via
 * `Date.UTC`). Zero entries: the wall time is skipped by a
 * spring-forward gap. Two entries: it repeats across a fall-back
 * overlap.
 */
function utcInstantsForWall(wallMs: number, timeZone: string): number[] {
  const offsets = new Set<number>([
    offsetAt(wallMs - DAY_MS, timeZone),
    offsetAt(wallMs, timeZone),
    offsetAt(wallMs + DAY_MS, timeZone),
  ]);
  const out: number[] = [];
  for (const offset of offsets) {
    const utc = wallMs - offset;
    if (offsetAt(utc, timeZone) === offset) out.push(utc);
  }
  return out.sort((a, b) => a - b);
}

/**
 * First UTC minute AFTER the transition that swallowed the
 * (nonexistent) wall time `wallMs` - the Vixie "run once immediately
 * after the change" instant for gap-scheduled fixed-time jobs.
 */
function gapTransitionEnd(wallMs: number, timeZone: string): number {
  let lo = Math.floor((wallMs - DAY_MS) / MINUTE_MS) * MINUTE_MS;
  let hi = Math.floor((wallMs + DAY_MS) / MINUTE_MS) * MINUTE_MS;
  const offLo = offsetAt(lo, timeZone);
  while (hi - lo > MINUTE_MS) {
    const mid = lo + Math.floor((hi - lo) / (2 * MINUTE_MS)) * MINUTE_MS;
    if (mid <= lo || mid >= hi) break;
    if (offsetAt(mid, timeZone) === offLo) lo = mid;
    else hi = mid;
  }
  return hi;
}

function isFullRange(set: ReadonlySet<number>, range: FieldRange): boolean {
  for (let v = range.min; v <= range.max; v += 1) {
    if (!set.has(v)) return false;
  }
  return true;
}

function nextWallDay(
  year: number,
  month: number,
  day: number,
): { year: number; month: number; day: number } {
  const d = new Date(Date.UTC(year, month - 1, day) + DAY_MS);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

function previousWallDay(
  year: number,
  month: number,
  day: number,
): { year: number; month: number; day: number } {
  const d = new Date(Date.UTC(year, month - 1, day) - DAY_MS);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

/** 4 years of wall-calendar days - mirrors the UTC path's horizon. */
const MAX_DAY_SCAN = 4 * 366;

function nextFireAfterInZone(parsed: ParsedCron, fromMs: number, timeZone: string): Date | null {
  // Vixie cron's DST compensation applies to "fixed-time" jobs only:
  // both the minute and the hour field name specific values. Jobs with
  // a full-range ("wildcard") minute or hour field follow the new wall
  // clock through a transition instead.
  const fixedTime =
    !isFullRange(parsed.minute, RANGES.minute) && !isFullRange(parsed.hour, RANGES.hour);
  const hours = [...parsed.hour].sort((a, b) => a - b);
  const minutes = [...parsed.minute].sort((a, b) => a - b);

  // Start one wall day EARLY: a fall-back transition can move the wall
  // clock backwards across midnight (e.g. America/Santiago ends DST at
  // 00:00), so instants > fromMs may still live on the previous wall
  // date. Candidates mapping to utc <= fromMs are filtered below.
  const startWall = wallPartsAt(fromMs, timeZone);
  let { year, month, day } = previousWallDay(startWall.year, startWall.month, startWall.day);

  for (let scanned = 0; scanned < MAX_DAY_SCAN; scanned += 1) {
    if (!parsed.month.has(month)) {
      // Jump to the 1st of the next wall month (same optimisation as
      // the UTC path).
      if (month === 12) {
        year += 1;
        month = 1;
      } else {
        month += 1;
      }
      day = 1;
      continue;
    }
    const dow = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    if (parsed.day.has(day) && parsed.dayOfWeek.has(dow)) {
      for (const hour of hours) {
        for (const minute of minutes) {
          const wallMs = Date.UTC(year, month - 1, day, hour, minute);
          const instants = utcInstantsForWall(wallMs, timeZone);
          let utc: number | null;
          if (instants.length === 1) {
            utc = instants[0] ?? null;
          } else if (instants.length > 1) {
            // Fall-back overlap: the wall time occurs twice. Fixed-time
            // jobs run only on the first pass; wildcard jobs on every
            // pass.
            utc = fixedTime ? (instants[0] ?? null) : (instants.find((t) => t > fromMs) ?? null);
          } else {
            // Spring-forward gap: the wall time never occurs. Fixed-time
            // jobs run once immediately after the transition; wildcard
            // jobs get no compensation.
            utc = fixedTime ? gapTransitionEnd(wallMs, timeZone) : null;
          }
          if (utc !== null && utc > fromMs) return new Date(utc);
        }
      }
    }
    ({ year, month, day } = nextWallDay(year, month, day));
  }
  return null;
}
