import { describe, expect, it } from 'vitest';
import { CronParseError, nextFireAfter, parseCron } from '../src/cron.js';

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
