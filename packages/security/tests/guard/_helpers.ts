import type { MemoryRegionReader } from '../../src/guard/types.js';

export function createReader(initial: Record<string, string>): {
  reader: MemoryRegionReader;
  set: (region: string, value: string) => void;
} {
  const state = new Map<string, string>(Object.entries(initial));
  return {
    reader: {
      regions: Object.freeze([...state.keys()]),
      read: async (region: string) => state.get(region) ?? '',
    },
    set: (region: string, value: string): void => {
      state.set(region, value);
    },
  };
}
