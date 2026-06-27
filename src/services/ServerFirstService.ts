import { Service } from 'typedi';

import { DataTableService } from './DataTableService';
import { ObjVarService } from './ObjVarService';
import { PlanetObjectService } from './PlanetObjectService';
import { StringFileLoader } from './StringFileLoader';

// Looked up by planet name so the OBJECT_ID isn't hardcoded across galaxies.
const SERVER_FIRST_PLANET = 'tatooine';
const SERVER_FIRST_PREFIX = 'collectionServerFirst.';
const COLLECTION_DATATABLE = 'collection/collection.iff';
const COLLECTION_STRING_FILE = 'collection_n';

interface CollectionRow {
  bookName?: string;
  collectionName?: string;
}

export interface ServerFirstRow {
  collectionName: string;
  displayName: string | null;
  category: string | null;
  characterName: string | null;
  characterOid: string | null;
  dateCompleted: string | null;
}

interface Completer {
  characterName: string | null;
  characterOid: string | null;
  dateCompleted: string | null;
}

/**
 * Decode the first-completer from a collectionServerFirst.* objvar value: a
 * STRING_ARRAY of [unixSeconds, characterOid, characterName], e.g.
 * ["1620521518", "264553502281", "Syrus Dyre"].
 */
export function parseServerFirstValue(value: unknown): Completer {
  const fromUnixSeconds = (raw: string): string | null => {
    if (!/^\d{8,}$/.test(raw)) return null;
    const ms = Number(raw) * 1000;
    return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
  };

  if (Array.isArray(value)) {
    const parts = value.map(v => (v == null ? '' : String(v)));
    return {
      characterName: parts.slice(2).join(':').trim() || null,
      characterOid: parts[1]?.trim() || null,
      dateCompleted: fromUnixSeconds(parts[0] ?? ''),
    };
  }

  if (typeof value === 'string') {
    return { characterName: value.trim() || null, characterOid: null, dateCompleted: null };
  }

  return { characterName: null, characterOid: null, dateCompleted: null };
}

@Service()
export class ServerFirstService {
  constructor(
    private readonly planetObjects: PlanetObjectService,
    private readonly objVars: ObjVarService,
    private readonly dataTable: DataTableService,
    private readonly strings: StringFileLoader
  ) {}

  async getServerFirsts(): Promise<ServerFirstRow[]> {
    const planetId = await this.planetObjects.getObjectIdByPlanetName(SERVER_FIRST_PLANET);
    if (!planetId) return [];

    const objVars = await this.objVars.getObjVarsForObject(planetId);
    const serverFirstVars = objVars.filter(ov => ov.name.startsWith(SERVER_FIRST_PREFIX));
    if (serverFirstVars.length === 0) return [];

    const neededNames = new Set(serverFirstVars.map(ov => ov.name.slice(SERVER_FIRST_PREFIX.length).toLowerCase()));
    // Names come from collection_n.stf, not the datatable, so they resolve even without collection.iff.
    const categoryByName = await this.buildCategoryMap(neededNames);

    const rows: ServerFirstRow[] = await Promise.all(
      serverFirstVars.map(async ov => {
        const collectionName = ov.name.slice(SERVER_FIRST_PREFIX.length);
        const completer = parseServerFirstValue(ov.value);
        return {
          collectionName,
          displayName: await this.strings.tryLoadFromRef(`${COLLECTION_STRING_FILE}:${collectionName}`),
          category: categoryByName.get(collectionName.toLowerCase()) ?? null,
          characterName: completer.characterName,
          characterOid: completer.characterOid,
          dateCompleted: completer.dateCompleted,
        };
      })
    );

    rows.sort(
      (a, b) =>
        (b.dateCompleted ?? '').localeCompare(a.dateCompleted ?? '') || a.collectionName.localeCompare(b.collectionName)
    );

    return rows;
  }

  // Parent-book label per needed collection from collection.iff's positional tree
  // (a bookName row sets the book for the collectionName rows under it).
  private async buildCategoryMap(neededNames: Set<string>): Promise<Map<string, string | null>> {
    const map = new Map<string, string | null>();

    let rows: CollectionRow[];
    try {
      rows = await this.dataTable.load<CollectionRow>({ fileName: COLLECTION_DATATABLE, camelcase: true });
    } catch (err) {
      console.warn('[ServerFirstService] collection.iff load failed; categories unavailable:', err);
      return map;
    }

    let book = '';
    for (const row of rows) {
      if (row.bookName) {
        book = row.bookName;
      } else if (row.collectionName) {
        const key = row.collectionName.toLowerCase();
        if (neededNames.has(key)) {
          map.set(key, book ? await this.strings.tryLoadFromRef(`${COLLECTION_STRING_FILE}:${book}`) : null);
        }
      }
    }

    return map;
  }
}
