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

// Partial collection.iff row (camelcase:true); only the columns we map are typed.
interface CollectionRow {
  name?: string;
  stringName?: string;
  category?: string;
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

function normalizeStringRef(stringName: string): string {
  return stringName.includes(':') ? stringName : `${COLLECTION_STRING_FILE}:${stringName}`;
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
    const displayByName = await this.buildCollectionDisplayMap(neededNames);

    const rows: ServerFirstRow[] = serverFirstVars.map(ov => {
      const collectionName = ov.name.slice(SERVER_FIRST_PREFIX.length);
      const completer = parseServerFirstValue(ov.value);
      const display = displayByName.get(collectionName.toLowerCase());
      return {
        collectionName,
        displayName: display?.displayName ?? null,
        category: display?.category ?? null,
        characterName: completer.characterName,
        characterOid: completer.characterOid,
        dateCompleted: completer.dateCompleted,
      };
    });

    // Newest first, then by collection name.
    rows.sort(
      (a, b) =>
        (b.dateCompleted ?? '').localeCompare(a.dateCompleted ?? '') || a.collectionName.localeCompare(b.collectionName)
    );

    return rows;
  }

  // Display name + category for the needed collections; missing data degrades to a raw name.
  private async buildCollectionDisplayMap(
    neededNames: Set<string>
  ): Promise<Map<string, { displayName: string | null; category: string | null }>> {
    const map = new Map<string, { displayName: string | null; category: string | null }>();

    let rows: CollectionRow[];
    try {
      rows = await this.dataTable.load<CollectionRow>({ fileName: COLLECTION_DATATABLE, camelcase: true });
    } catch {
      return map;
    }

    for (const row of rows) {
      const key = row.name?.toLowerCase();
      if (!key || !neededNames.has(key)) continue;
      const displayName = row.stringName ? await this.strings.tryLoadFromRef(normalizeStringRef(row.stringName)) : null;
      map.set(key, { displayName, category: row.category ?? null });
    }

    return map;
  }
}
