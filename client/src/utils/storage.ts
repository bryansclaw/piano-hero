/**
 * localStorage utility with versioning, migration, and error handling.
 */

export const STORAGE_VERSION = 1;

interface VersionedData<T> {
  version: number;
  data: T;
}

/**
 * Safely load data from localStorage with version checking.
 * Returns defaultValue if:
 * - Key doesn't exist
 * - JSON is corrupted
 * - Version mismatch (data is reset)
 * - Any other error
 */
export function safeLoad<T>(key: string, defaultValue: T, version: number = STORAGE_VERSION): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;

    const parsed = JSON.parse(raw);

    // Handle legacy unversioned data: wrap it as current version
    if (parsed !== null && typeof parsed === 'object' && !('version' in parsed)) {
      console.warn(`[PianoHero] Migrating unversioned data for "${key}" to version ${version}`);
      // Legacy data — treat as the data itself and save with version
      const versioned: VersionedData<T> = { version, data: parsed as T };
      try {
        localStorage.setItem(key, JSON.stringify(versioned));
      } catch {
        // Quota exceeded during migration — return parsed data anyway
      }
      return parsed as T;
    }

    const versioned = parsed as VersionedData<T>;

    if (versioned.version !== version) {
      console.warn(
        `[PianoHero] Version mismatch for "${key}": stored v${versioned.version}, expected v${version}. Resetting to defaults.`
      );
      // Could add migration logic here in the future
      safeSave(key, defaultValue, version);
      return defaultValue;
    }

    return versioned.data;
  } catch (e) {
    console.warn(`[PianoHero] Failed to load "${key}" from localStorage:`, e);
    return defaultValue;
  }
}

/**
 * Safely save data to localStorage with version tag.
 * Returns false if save fails (e.g., quota exceeded).
 */
export function safeSave<T>(key: string, data: T, version: number = STORAGE_VERSION): boolean {
  try {
    const versioned: VersionedData<T> = { version, data };
    const json = JSON.stringify(versioned);

    // Warn if approaching localStorage limit (~5MB)
    if (json.length > 4 * 1024 * 1024) {
      console.warn(`[PianoHero] Data for "${key}" is ${Math.round(json.length / 1024)}KB — approaching localStorage limit`);
    }

    localStorage.setItem(key, json);
    return true;
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      console.error(`[PianoHero] localStorage quota exceeded when saving "${key}"`);
    } else {
      console.error(`[PianoHero] Failed to save "${key}" to localStorage:`, e);
    }
    return false;
  }
}

/**
 * Remove a key from localStorage safely.
 */
export function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Silently ignore
  }
}
