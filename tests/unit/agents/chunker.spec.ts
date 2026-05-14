import { describe, it, expect } from 'vitest';
import { chunkDocument } from '@/lib/agents/chunker';

describe('Chunker Agent', () => {
  it('should be defined', () => {
    expect(chunkDocument).toBeDefined();
  });
});
