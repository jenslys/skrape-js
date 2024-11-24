import { Skrape, SkrapeError } from '../index';
import { z } from 'zod';

describe('Skrape', () => {
  let skrape: Skrape;

  beforeEach(() => {
    skrape = new Skrape({
      apiKey: 'test-key',
    });
  });

  it('should create a Skrape instance', () => {
    expect(skrape).toBeInstanceOf(Skrape);
  });

  it('should throw error if apiKey is missing', () => {
    expect(() => new Skrape({} as any)).toThrow();
  });

  it('should have correct default baseUrl', () => {
    expect((skrape as any).baseUrl).toBe('https://skrape.ai/api');
  });

  it('should store API key', () => {
    expect((skrape as any).apiKey).toBe('test-key');
  });
});
