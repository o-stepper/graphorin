/**
 * Unit coverage for the shared `LocalProviderTrust` classifier.
 */
import { describe, expect, it } from 'vitest';

import {
  classifyLocalProvider,
  PERMANENT_LOOPBACK_CLASSIFICATION,
  SENSITIVITY_DEFAULTS_PER_TRUST,
} from '../../src/trust/classify-local-provider.js';

describe('classifyLocalProvider', () => {
  it('classifies localhost as loopback', () => {
    const c = classifyLocalProvider('http://localhost:11434');
    expect(c.trust).toBe('loopback');
    expect(c.acceptsSensitivity).toEqual(['public', 'internal', 'secret']);
  });

  it('classifies 127.0.0.1 as loopback', () => {
    expect(classifyLocalProvider('http://127.0.0.1:8080').trust).toBe('loopback');
  });

  it('classifies ::1 as loopback', () => {
    expect(classifyLocalProvider('http://[::1]:8080').trust).toBe('loopback');
  });

  it('classifies unix:// as loopback', () => {
    expect(classifyLocalProvider('unix:///var/run/llama.sock').trust).toBe('loopback');
  });

  it('classifies RFC 1918 addresses as private', () => {
    expect(classifyLocalProvider('http://10.0.0.5:8080').trust).toBe('private');
    expect(classifyLocalProvider('http://192.168.1.50:11434').trust).toBe('private');
    expect(classifyLocalProvider('http://172.20.0.5:8080').trust).toBe('private');
  });

  it('classifies CGNAT (100.64/10) as private', () => {
    expect(classifyLocalProvider('http://100.100.100.100:11434').trust).toBe('private');
  });

  it('classifies link-local IPv4 (169.254/16) as private', () => {
    expect(classifyLocalProvider('http://169.254.1.5:11434').trust).toBe('private');
  });

  it('classifies private hostname suffixes as private', () => {
    expect(classifyLocalProvider('http://homelab.local:11434').trust).toBe('private');
    expect(classifyLocalProvider('http://server.lan:11434').trust).toBe('private');
    expect(classifyLocalProvider('http://workstation.internal:11434').trust).toBe('private');
    expect(classifyLocalProvider('http://device.home.arpa:11434').trust).toBe('private');
  });

  it('classifies public IPv4 over HTTPS as public-tls', () => {
    expect(classifyLocalProvider('https://5.6.7.8:443').trust).toBe('public-tls');
  });

  it('classifies public IPv4 over HTTP as public-cleartext', () => {
    const c = classifyLocalProvider('http://5.6.7.8:80');
    expect(c.trust).toBe('public-cleartext');
    expect(c.acceptsSensitivity).toEqual([]);
  });

  it('classifies public hostname over HTTPS as public-tls', () => {
    expect(classifyLocalProvider('https://example.com:443').trust).toBe('public-tls');
  });

  it('classifies public hostname over HTTP as public-cleartext', () => {
    expect(classifyLocalProvider('http://example.com:80').trust).toBe('public-cleartext');
  });

  it('rejects empty / invalid URLs at the boundary', () => {
    expect(() => classifyLocalProvider('')).toThrow(TypeError);
    expect(() => classifyLocalProvider('not a url')).toThrow(TypeError);
  });

  it('exposes the canonical sensitivity defaults table', () => {
    expect(SENSITIVITY_DEFAULTS_PER_TRUST.loopback).toEqual(['public', 'internal', 'secret']);
    expect(SENSITIVITY_DEFAULTS_PER_TRUST.private).toEqual(['public', 'internal']);
    expect(SENSITIVITY_DEFAULTS_PER_TRUST['public-tls']).toEqual(['public']);
    expect(SENSITIVITY_DEFAULTS_PER_TRUST['public-cleartext']).toEqual([]);
  });

  it('exposes the in-process permanent-loopback classification', () => {
    expect(PERMANENT_LOOPBACK_CLASSIFICATION.trust).toBe('loopback');
    expect(PERMANENT_LOOPBACK_CLASSIFICATION.acceptsSensitivity).toEqual([
      'public',
      'internal',
      'secret',
    ]);
  });
});
