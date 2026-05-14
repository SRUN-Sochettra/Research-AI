import { describe, it, expect } from 'vitest';
import { chunkText } from '@/lib/agents/chunker';

describe('Chunker Agent', () => {
  it('should be defined', () => {
    expect(chunkText).toBeDefined();
  });
});
