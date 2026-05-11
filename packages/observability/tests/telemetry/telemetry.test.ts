import { describe, expect, it } from 'vitest';

import {
  announceTelemetryPosture,
  enableTelemetry,
  getTelemetryStatus,
} from '../../src/telemetry/index.js';

describe('@graphorin/observability/telemetry', () => {
  it('reports disabled status and clean reason', () => {
    const status = getTelemetryStatus({});
    expect(status.enabled).toBe(false);
    expect(status.reason).toContain('zero default telemetry');
  });

  it('mirrors GRAPHORIN_TELEMETRY when set', () => {
    const status = getTelemetryStatus({ GRAPHORIN_TELEMETRY: 'disabled' });
    expect(status.env).toBe('disabled');
  });

  it('mirrors GRAPHORIN_NO_PHONE_HOME when set', () => {
    const status = getTelemetryStatus({ GRAPHORIN_NO_PHONE_HOME: '1' });
    expect(status.noPhoneHome).toBe('1');
  });

  it('enableTelemetry always returns the disabled sentinel', () => {
    const result = enableTelemetry();
    expect(result.status).toBe('disabled');
    expect(result.reason).toContain('zero default telemetry');
  });

  it('announceTelemetryPosture surfaces both env vars when present', () => {
    const lines: string[] = [];
    const announced = announceTelemetryPosture({
      env: { GRAPHORIN_TELEMETRY: 'disabled', GRAPHORIN_NO_PHONE_HOME: '1' },
      sink: (l) => lines.push(l),
    });
    expect(announced).toHaveLength(2);
    expect(lines.some((l) => l.includes('GRAPHORIN_TELEMETRY'))).toBe(true);
    expect(lines.some((l) => l.includes('GRAPHORIN_NO_PHONE_HOME'))).toBe(true);
  });

  it('announceTelemetryPosture is a no-op when env vars are absent', () => {
    const lines = announceTelemetryPosture({ env: {}, sink: () => {} });
    expect(lines).toEqual([]);
  });
});
