import { describe, expect, it } from 'vitest';

import { _resolveLauncherForTesting } from '../../src/oauth/browser.js';

describe('SPL-18 - Windows launcher does not re-parse the URL through cmd.exe', () => {
  it('the win32 launcher avoids cmd /c start (no cmd double-parse of the URL)', () => {
    const spec = _resolveLauncherForTesting('https://issuer.example.com/oauth/authorize', 'win32');
    expect(spec.command).not.toBe('cmd');
    // The URL is a standalone argument, not embedded in a cmd command line.
    expect(spec.args).toContain('https://issuer.example.com/oauth/authorize');
  });

  it('rejects a URL with cmd metacharacters before it can reach any launcher', () => {
    expect(() =>
      _resolveLauncherForTesting('https://issuer.example.com/a&calc.exe', 'win32'),
    ).toThrow();
  });

  it('rejects a non-http(s) scheme', () => {
    expect(() => _resolveLauncherForTesting('file:///etc/passwd', 'win32')).toThrow();
    expect(() => _resolveLauncherForTesting('javascript:alert(1)', 'darwin')).toThrow();
  });

  it('still launches a clean https URL on darwin / linux', () => {
    expect(_resolveLauncherForTesting('https://ok.example.com/x', 'darwin').command).toBe('open');
    expect(_resolveLauncherForTesting('https://ok.example.com/x', 'linux').command).toBe(
      'xdg-open',
    );
  });
});
