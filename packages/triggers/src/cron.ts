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
 * The scheduler treats every trigger as **UTC**. Operators that need
 * a local-time fire encode the offset directly into their cron
 * expression (e.g. `0 14 * * *` for "9am Eastern in winter").
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
 * cron schedule. Returns a UTC `Date` (the scheduler treats every
 * trigger as UTC; operators that need local time express that in
 * their cron expression).
 *
 * Returns `null` if no fire happens in the next 4 years (defensive -
 * impossible for a well-formed cron expression except a vacuous
 * combination that never aligns).
 *
 * @stable
 */
export function nextFireAfter(parsed: ParsedCron, from: Date): Date | null {
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
