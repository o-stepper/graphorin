import type { Fact, MemoryHit } from '@graphorin/core';

export function fact(id: string, text: string): Fact {
  return {
    id,
    kind: 'semantic',
    userId: 'u1',
    sensitivity: 'public',
    createdAt: '2026-01-01T00:00:00.000Z',
    text,
  };
}

export function hit(id: string, text: string, score: number): MemoryHit<Fact> {
  return {
    record: fact(id, text),
    score,
    signals: { vector: score },
  };
}
