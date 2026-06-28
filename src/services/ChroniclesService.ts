import { Service } from 'typedi';

import { PropertyListIds } from '../types/PropertyList';

import knexDb from './db';

/**
 * Derived from city_objects.tab. The galaxy has a single city aggregator object,
 * and its Citizens (LIST_ID 13) property list is overloaded as a chronicler
 * meta-list: alongside the per-city citizen rows it carries one `v3:` chronicler
 * record per chronicler. CityService reads this object and skips the v3 rows;
 * this service decodes them.
 */
interface CityObjectRecord {
  OBJECT_ID: number;
}

interface PropertyListValueRecord {
  VALUE: string;
}

export interface ChroniclerStatsRow {
  name: string;
  characterOid: string | null;
  xp: number;
  silverTokens: number;
  goldTokens: number;
  questsCreated: number;
  questsCompleted: number;
  questsPlayed: number;
  ratingCount: number;
  ratingTotal: number;
  ratedQuestCount: number;
}

/**
 * Decode one `v3:` chronicler record. The wire format is fixed by the game's
 * CityStringParser::buildPgcRatingSpec:
 *   v3 : oid : name : ratingCount : ratingTotal : lastRatingTime : m_data[0..19]
 * so colon field [n] maps to m_data[n - 6]. The m_data slot meanings come from the
 * server's pgc_quests.scriptlib (MID = quest weight 15-30, HIGH = >=30; ALL = any):
 *   [0] XP  [1] silver tokens  [2] gold tokens
 *   [3] created ALL  [4] created MID  [5] created HIGH
 *   [6] your quests others completed ALL  [7] MID  [8] HIGH
 *   [9] you completed ALL  [10] MID  [11] HIGH   (slots 12-19 are unused)
 * "Quality" below means MID+HIGH (weight >= 15).
 * Returns null for a non-v3 or nameless value so callers can filter.
 */
export function parseChroniclerValue(value: string): ChroniclerStatsRow | null {
  if (!value || !value.startsWith('v3:')) return null;

  const fields = value.split(':');
  const num = (i: number): number => {
    const n = Number(fields[i]);
    return Number.isFinite(n) ? n : 0;
  };

  const name = (fields[2] ?? '').trim();
  if (!name) return null;

  return {
    name,
    characterOid: (fields[1] ?? '').trim() || null,
    xp: num(6),
    silverTokens: num(7),
    goldTokens: num(8),
    questsCreated: num(10) + num(11),
    questsCompleted: num(16) + num(17),
    questsPlayed: num(12),
    ratingCount: num(3),
    ratingTotal: num(4),
    ratedQuestCount: num(13) + num(14),
  };
}

@Service()
export class ChroniclesService {
  async getChroniclers(): Promise<ChroniclerStatsRow[]> {
    const objectId = await this.getMasterCityObjectId();
    if (objectId === null) return [];

    const rows = await this.queryV3Rows(objectId, 'v3:%');
    return rows.map(row => parseChroniclerValue(row.VALUE)).filter((r): r is ChroniclerStatsRow => r !== null);
  }

  async getChronicler(oid: string): Promise<ChroniclerStatsRow | null> {
    const objectId = await this.getMasterCityObjectId();
    if (objectId === null) return null;

    // Anchor the VALUE prefix on the chronicler's oid (record field [1]) so the
    // same composite-PK index scan returns just this chronicler's single row.
    const [row] = await this.queryV3Rows(objectId, `v3:${oid}:%`);
    return row ? parseChroniclerValue(row.VALUE) : null;
  }

  // The single aggregator object whose overloaded Citizens (LIST_ID 13) list holds
  // the chronicler meta-records (CityService reads the same object).
  private async getMasterCityObjectId(): Promise<number | null> {
    const cityObject = await knexDb.first().from<CityObjectRecord>('CITY_OBJECTS');
    return cityObject ? cityObject.OBJECT_ID : null;
  }

  // Pull only chronicler meta-records, not the per-city citizen rows that share
  // LIST_ID 13. The (OBJECT_ID, LIST_ID, VALUE) primary key makes the `v3:` prefix
  // an index range scan, so the DB never ships the (far more numerous) citizen rows.
  private queryV3Rows(objectId: number, valueLike: string): Promise<PropertyListValueRecord[]> {
    return knexDb<PropertyListValueRecord>('PROPERTY_LISTS')
      .select('VALUE')
      .where('OBJECT_ID', objectId)
      .andWhere('LIST_ID', PropertyListIds.Citizens)
      .andWhere('VALUE', 'like', valueLike);
  }
}
