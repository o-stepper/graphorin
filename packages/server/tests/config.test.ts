import { describe, expect, it } from 'vitest';
import { defineConfig, parseServerConfig } from '../src/config.js';
import { ConfigInvalidError } from '../src/errors/index.js';

describe('parseServerConfig', () => {
  it('returns documented defaults for an empty input', () => {
    const config = parseServerConfig({});
    expect(config.server.host).toBe('127.0.0.1');
    expect(config.server.port).toBe(8080);
    expect(config.server.basePath).toBe('/v1');
    expect(config.server.cors.allowOrigins).toEqual([]);
    expect(config.server.cors.allowCredentials).toBe(false);
    expect(config.server.csrf.enabled).toBe(true);
    expect(config.server.idempotency.requireKey).toBe('warn');
    expect(config.server.idempotency.ttlSeconds).toBe(86_400);
    expect(config.auth.kind).toBe('token');
    expect(config.secrets.source).toBe('auto');
    expect(config.hardening.refuseRoot).toBe(true);
    expect(config.hardening.umask).toBe(0o077);
  });

  it('returns the same shape when the input is omitted', () => {
    const config = parseServerConfig(undefined);
    expect(config.server.host).toBe('127.0.0.1');
  });

  it('honours user-provided overrides without mutating defaults for siblings', () => {
    const config = parseServerConfig({
      server: { host: '0.0.0.0', port: 9000 },
      auth: { kind: 'token', pepperRef: 'env:PEPPER' },
    });
    expect(config.server.host).toBe('0.0.0.0');
    expect(config.server.port).toBe(9000);
    expect(config.auth.pepperRef).toBe('env:PEPPER');
  });

  it('rejects unknown top-level keys', () => {
    expect(() => parseServerConfig({ foo: 1 } as unknown)).toThrowError(ConfigInvalidError);
  });

  it('rejects malformed nested values with a typed error', () => {
    try {
      parseServerConfig({ server: { port: -1 } });
      throw new Error('expected throw');
    } catch (err) {
      expect(err).toBeInstanceOf(ConfigInvalidError);
      const issues = (err as ConfigInvalidError).issues;
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0]?.path.join('.')).toBe('server.port');
    }
  });

  it('defineConfig is a typed identity helper', () => {
    const value = defineConfig({ server: { port: 1234 } });
    expect(value).toEqual({ server: { port: 1234 } });
  });

  it('W-010: retention defaults - derived data on, primary content opt-in', () => {
    const config = parseServerConfig({});
    expect(config.retention.enabled).toBe(true);
    expect(config.retention.intervalMs).toBe(6 * 60 * 60 * 1000);
    expect(config.retention.spansDays).toBe(30);
    expect(config.retention.consolidatorRunsDays).toBe(90);
    expect(config.retention.dlqExhaustedDays).toBe(30);
    expect(config.retention.idempotency).toBe(true);
    expect(config.retention.sessionsClosedOnly).toBe(true);
    expect(config.retention.sessionsDays).toBeUndefined();
    expect(config.retention.memoryHistoryDays).toBeUndefined();
    expect(config.retention.workflowThreadsDays).toBeUndefined();
    expect(config.retention.auditDays).toBeUndefined();
  });

  it('W-010: retention rejects non-positive day windows', () => {
    expect(() => parseServerConfig({ retention: { spansDays: -1 } })).toThrowError(
      ConfigInvalidError,
    );
    expect(() => parseServerConfig({ retention: { sessionsDays: 0 } })).toThrowError(
      ConfigInvalidError,
    );
  });
});
