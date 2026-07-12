import { describe, expect, it } from 'vitest';
import { CronParseError, isValidTimeZone, nextFireAfter, parseCron } from '../src/cron.js';

describe('parseCron', () => {
  it('parses every-minute', () => {
    const p = parseCron('* * * * *');
    expect(p.minute.size).toBe(60);
    expect(p.hour.size).toBe(24);
    expect(p.day.size).toBe(31);
    expect(p.month.size).toBe(12);
    expect(p.dayOfWeek.size).toBe(7);
  });

  it('parses ranges + steps', () => {
    const p = parseCron('0-30/10 * * * *');
    expect([...p.minute].sort((a, b) => a - b)).toEqual([0, 10, 20, 30]);
  });

  it('parses lists', () => {
    const p = parseCron('0,15,30,45 * * * *');
    expect([...p.minute].sort((a, b) => a - b)).toEqual([0, 15, 30, 45]);
  });

  it('parses every-N steps without explicit range', () => {
    const p = parseCron('*/15 * * * *');
    expect([...p.minute].sort((a, b) => a - b)).toEqual([0, 15, 30, 45]);
  });

  it('parses single-value', () => {
    const p = parseCron('5 * * * *');
    expect([...p.minute]).toEqual([5]);
  });

  it('rejects empty expression', () => {
    expect(() => parseCron('')).toThrow(CronParseError);
  });

  it('rejects wrong field count', () => {
    expect(() => parseCron('* * *')).toThrow(/expected 5/);
  });

  it('rejects out-of-range value', () => {
    expect(() => parseCron('70 * * * *')).toThrow(/value out of range/);
  });

  it('rejects non-numeric component', () => {
    expect(() => parseCron('foo * * * *')).toThrow(/not numeric/);
  });

  it('rejects invalid step', () => {
    expect(() => parseCron('*/0 * * * *')).toThrow(/invalid step/);
  });
});

describe('nextFireAfter', () => {
  it('returns the next minute for *', () => {
    const p = parseCron('* * * * *');
    const next = nextFireAfter(p, new Date('2026-04-19T10:30:15Z'));
    expect(next?.toISOString()).toBe('2026-04-19T10:31:00.000Z');
  });

  it('returns the next hour boundary for `0 * * * *`', () => {
    const p = parseCron('0 * * * *');
    const next = nextFireAfter(p, new Date('2026-04-19T10:30:15Z'));
    expect(next?.toISOString()).toBe('2026-04-19T11:00:00.000Z');
  });

  it('returns the next day at 09:00 for `0 9 * * *`', () => {
    const p = parseCron('0 9 * * *');
    const next = nextFireAfter(p, new Date('2026-04-19T10:30:15Z'));
    expect(next?.toISOString()).toBe('2026-04-20T09:00:00.000Z');
  });

  it('respects month + day-of-week constraints', () => {
    // First Monday of February 2026 is the 2nd.
    const p = parseCron('0 12 1-7 2 1');
    const next = nextFireAfter(p, new Date('2026-01-01T00:00:00Z'));
    expect(next?.toISOString()).toBe('2026-02-02T12:00:00.000Z');
  });
});

describe('nextFireAfter with an IANA timezone (W-124)', () => {
  it('maps a wall-clock schedule to the current UTC offset (winter vs summer)', () => {
    const p = parseCron('30 14 * * *');
    // Winter (EST, UTC-5): 14:30 New York = 19:30Z.
    expect(
      nextFireAfter(p, new Date('2026-01-10T00:00:00Z'), 'America/New_York')?.toISOString(),
    ).toBe('2026-01-10T19:30:00.000Z');
    // Summer (EDT, UTC-4): 14:30 New York = 18:30Z.
    expect(
      nextFireAfter(p, new Date('2026-07-10T00:00:00Z'), 'America/New_York')?.toISOString(),
    ).toBe('2026-07-10T18:30:00.000Z');
  });

  it('spring-forward gap: a fixed-time job runs once immediately after the transition (Vixie)', () => {
    // US DST starts 2026-03-08: 02:00 EST jumps to 03:00 EDT (transition at 07:00Z).
    const p = parseCron('30 2 * * *');
    const next = nextFireAfter(p, new Date('2026-03-08T00:00:00Z'), 'America/New_York');
    expect(next?.toISOString()).toBe('2026-03-08T07:00:00.000Z');
    // ...and exactly once: computed from that instant, the next fire is
    // the regular 02:30 EDT slot a day later, not the gap again.
    const after = nextFireAfter(p, next as Date, 'America/New_York');
    expect(after?.toISOString()).toBe('2026-03-09T06:30:00.000Z');
  });

  it('fall-back overlap: a fixed-time job runs only on the first pass (Vixie)', () => {
    // US DST ends 2026-11-01: 02:00 EDT falls back to 01:00 EST (transition at 06:00Z).
    const p = parseCron('30 1 * * *');
    const first = nextFireAfter(p, new Date('2026-11-01T00:00:00Z'), 'America/New_York');
    expect(first?.toISOString()).toBe('2026-11-01T05:30:00.000Z'); // 01:30 EDT, first pass
    // From just after the first pass, the repeated 01:30 EST (06:30Z) is
    // skipped; the next fire lands on the following day.
    const second = nextFireAfter(p, first as Date, 'America/New_York');
    expect(second?.toISOString()).toBe('2026-11-02T06:30:00.000Z');
  });

  it('fall-back overlap: a wildcard job follows the wall clock through both passes', () => {
    const p = parseCron('*/30 * * * *'); // wildcard hour + full-range minute steps
    // 05:45Z = 01:45 EDT (first pass). Next fire: 06:00Z = 01:00 EST (second pass).
    const next = nextFireAfter(p, new Date('2026-11-01T05:45:00Z'), 'America/New_York');
    expect(next?.toISOString()).toBe('2026-11-01T06:00:00.000Z');
  });

  it('spring-forward gap: a wildcard job skips the gap without compensation', () => {
    const p = parseCron('*/30 * * * *');
    // 06:45Z = 01:45 EST; the 02:00/02:30 wall slots never occur, the
    // next real slot is 03:00 EDT = 07:00Z.
    const next = nextFireAfter(p, new Date('2026-03-08T06:45:00Z'), 'America/New_York');
    expect(next?.toISOString()).toBe('2026-03-08T07:00:00.000Z');
  });

  it('handles a second zone: Europe/Berlin spring-forward (02:00 -> 03:00 at 01:00Z)', () => {
    // EU DST starts 2026-03-29; the gapped 02:15 job runs at the
    // transition instant 01:00Z (= 03:00 CEST).
    const p = parseCron('15 2 * * *');
    const next = nextFireAfter(p, new Date('2026-03-29T00:00:00Z'), 'Europe/Berlin');
    expect(next?.toISOString()).toBe('2026-03-29T01:00:00.000Z');
  });

  it("timezone 'UTC' matches the default UTC path", () => {
    const p = parseCron('0 9 * * *');
    const a = nextFireAfter(p, new Date('2026-04-19T10:30:15Z'));
    const b = nextFireAfter(p, new Date('2026-04-19T10:30:15Z'), 'UTC');
    expect(b?.toISOString()).toBe(a?.toISOString());
  });

  it('AND day/dayOfWeek semantics are unchanged under a timezone', () => {
    // First Monday of February 2026 (the 2nd), 12:00 in New York = 17:00Z.
    const p = parseCron('0 12 1-7 2 1');
    const next = nextFireAfter(p, new Date('2026-01-01T00:00:00Z'), 'America/New_York');
    expect(next?.toISOString()).toBe('2026-02-02T17:00:00.000Z');
  });

  it('isValidTimeZone accepts real zones and rejects typos', () => {
    expect(isValidTimeZone('America/New_York')).toBe(true);
    expect(isValidTimeZone('Europe/Berlin')).toBe(true);
    expect(isValidTimeZone('Not/AZone')).toBe(false);
  });
});
