import DataLoader from 'dataloader';
import { Service } from 'typedi';

import { loadStringFile } from '../utils/StringFileReader';

/**
 * Parses a string reference in the format "@file_name:key" or "file_name:key".
 * Returns null if the format is invalid.
 */
export function parseStringRef(ref: string): { fileName: string; key: string } | null {
  // Remove optional @ prefix
  const normalized = ref.startsWith('@') ? ref.slice(1) : ref;

  const colonIndex = normalized.indexOf(':');
  if (colonIndex === -1) return null;

  const fileName = normalized.slice(0, colonIndex);
  const key = normalized.slice(colonIndex + 1);

  if (!fileName || !key) return null;

  return { fileName, key };
}

@Service({
  global: true,
})
export class StringFileLoader {
  private dataloader = new DataLoader(StringFileLoader.batchFunction, { maxBatchSize: 999, cache: true });
  load = this.dataloader.load.bind(this.dataloader);

  /**
   * Loads a string from a reference in the format "@file_name:key" or "file_name:key".
   * Returns the resolved string, or the fallback if not found.
   * Key lookup is case-insensitive.
   * @param ref - String reference (e.g., "@obj_attr_n:efficiency")
   * @param fallback - Value to return if the string is not found (defaults to the key)
   */
  async loadFromRef(ref: string, fallback?: string): Promise<string> {
    const parsed = parseStringRef(ref);
    if (!parsed) return fallback ?? ref;

    const strings = await this.load(parsed.fileName);

    // Try exact match first, then case-insensitive
    const exactMatch = strings[parsed.key];
    if (exactMatch !== undefined) {
      return exactMatch;
    }

    // Case-insensitive lookup
    const keyLower = parsed.key.toLowerCase();
    for (const [key, value] of Object.entries(strings)) {
      if (key.toLowerCase() === keyLower && value !== undefined) {
        return value;
      }
    }

    return fallback ?? parsed.key;
  }

  static batchFunction(fileNames: readonly string[]) {
    return Promise.all(fileNames.map(fileName => loadStringFile(fileName)));
  }
}
