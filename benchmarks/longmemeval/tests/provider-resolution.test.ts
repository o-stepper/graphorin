/**
 * Graphorin — MIT License — Copyright (c) 2026 Oleksiy Stepurenko
 *
 * EB-1: the runner must offer a real-provider CLI path (so a maintainer can
 * seed real baselines) and stamp the provider provenance into every generated
 * RESULTS header — a stub run must never read as a real result. These tests
 * stay fully offline: a real provider is only *constructed* (HTTP adapters do
 * not touch the network until `generate()`), never called.
 */

import { describe, expect, it } from 'vitest';

import { buildResultsHeader, resolveBenchProvider } from '../src/runner.js';

describe('EB-1: real-provider resolution', () => {
  it('defaults to the offline stub, labelled plumbing-only', () => {
    const { provider, label } = resolveBenchProvider();
    expect(label).toBe('stub (plumbing-only)');
    expect(provider.name).toBe('stub');
  });

  it('treats an explicit "stub" name the same as the default', () => {
    const { label } = resolveBenchProvider({ name: 'stub' });
    expect(label).toBe('stub (plumbing-only)');
  });

  it('constructs a real Ollama provider from name + model (loopback default)', () => {
    const { provider, label } = resolveBenchProvider({ name: 'ollama', model: 'llama3.1' });
    expect(label).toBe('ollama:llama3.1');
    // A real provider, NOT the stub — and carrying the requested model id.
    expect(provider.name).not.toBe('stub');
    expect(provider.modelId).toBe('llama3.1');
  });

  it('requires a model for a real provider', () => {
    expect(() => resolveBenchProvider({ name: 'ollama' })).toThrow(/model/i);
  });

  it('requires a base URL for the openai-compatible provider', () => {
    expect(() => resolveBenchProvider({ name: 'openai-compatible', model: 'gpt-x' })).toThrow(
      /base[- ]?url/i,
    );
  });

  it('rejects an unknown provider name, naming the valid choices', () => {
    expect(() => resolveBenchProvider({ name: 'bogus', model: 'x' })).toThrow(/ollama/i);
  });
});

describe('EB-1: RESULTS provenance stamp', () => {
  it('stamps the stub disclaimer into the RESULTS header', () => {
    const header = buildResultsHeader('stub (plumbing-only)');
    expect(header).toContain('**Provider:** stub (plumbing-only)');
  });

  it('stamps a real provider label into the RESULTS header', () => {
    const header = buildResultsHeader('ollama:llama3.1');
    expect(header).toContain('**Provider:** ollama:llama3.1');
  });
});
