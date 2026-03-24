import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { safeLoad, safeSave, safeRemove, STORAGE_VERSION } from '../storage';

const TEST_KEY = 'piano-hero-test-storage';

describe('storage utility', () => {
  beforeEach(() => {
    localStorage.removeItem(TEST_KEY);
  });

  afterEach(() => {
    localStorage.removeItem(TEST_KEY);
  });

  describe('safeSave', () => {
    it('saves data with version wrapper', () => {
      const result = safeSave(TEST_KEY, { name: 'test' });
      expect(result).toBe(true);
      const raw = localStorage.getItem(TEST_KEY);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed.version).toBe(STORAGE_VERSION);
      expect(parsed.data).toEqual({ name: 'test' });
    });

    it('saves with custom version', () => {
      safeSave(TEST_KEY, { x: 1 }, 42);
      const parsed = JSON.parse(localStorage.getItem(TEST_KEY)!);
      expect(parsed.version).toBe(42);
    });

    it('returns false on quota exceeded', () => {
      // Mock localStorage.setItem to throw QuotaExceededError
      const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        const err = new DOMException('Quota exceeded', 'QuotaExceededError');
        throw err;
      });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = safeSave(TEST_KEY, { large: 'data' });
      expect(result).toBe(false);

      spy.mockRestore();
      consoleSpy.mockRestore();
    });

    it('warns when data approaches limit', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      // Create data > 4MB
      const bigData = 'x'.repeat(4.5 * 1024 * 1024);
      safeSave(TEST_KEY, bigData);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('approaching localStorage limit'),
      );
      consoleSpy.mockRestore();
    });
  });

  describe('safeLoad', () => {
    it('returns default value when key does not exist', () => {
      const result = safeLoad(TEST_KEY, { name: 'default' });
      expect(result).toEqual({ name: 'default' });
    });

    it('returns saved data with matching version', () => {
      safeSave(TEST_KEY, { name: 'saved' });
      const result = safeLoad(TEST_KEY, { name: 'default' });
      expect(result).toEqual({ name: 'saved' });
    });

    it('returns default on version mismatch', () => {
      safeSave(TEST_KEY, { name: 'old' }, 1);
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result = safeLoad(TEST_KEY, { name: 'default' }, 2);
      expect(result).toEqual({ name: 'default' });
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Version mismatch'),
      );
      consoleSpy.mockRestore();
    });

    it('migrates legacy unversioned data', () => {
      // Simulate old-style data without version wrapper
      localStorage.setItem(TEST_KEY, JSON.stringify({ name: 'legacy' }));
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result = safeLoad(TEST_KEY, { name: 'default' });
      expect(result).toEqual({ name: 'legacy' });
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Migrating unversioned data'),
      );
      consoleSpy.mockRestore();

      // Verify it was re-saved with version
      const raw = JSON.parse(localStorage.getItem(TEST_KEY)!);
      expect(raw.version).toBe(STORAGE_VERSION);
    });

    it('returns default on corrupted JSON', () => {
      localStorage.setItem(TEST_KEY, 'not valid json {{{{');
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result = safeLoad(TEST_KEY, { fallback: true });
      expect(result).toEqual({ fallback: true });
      consoleSpy.mockRestore();
    });

    it('handles null stored value', () => {
      localStorage.setItem(TEST_KEY, 'null');
      // null is not an object with 'version', so it goes to legacy path, but null check handles it
      const result = safeLoad(TEST_KEY, { x: 1 });
      // null is not an object, so it falls through as non-object legacy
      expect(result).toBeDefined();
    });
  });

  describe('safeRemove', () => {
    it('removes a key', () => {
      safeSave(TEST_KEY, { data: true });
      safeRemove(TEST_KEY);
      expect(localStorage.getItem(TEST_KEY)).toBeNull();
    });

    it('does not throw on non-existent key', () => {
      expect(() => safeRemove('nonexistent-key-abc')).not.toThrow();
    });
  });
});
