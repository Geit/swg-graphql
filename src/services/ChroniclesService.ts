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
  questsCreated: number;
  questsCompleted: number;
  ratingCount: number;
  ratingTotal: number;
  ratedQuestCount: number;
}

/**
 * Decode one `v3:` chronicler record from the Citizens (LIST_ID 13) property
 * list. The wire format is fixed by the game's CityStringParser::buildPgcRatingSpec:
 *   v3 : chroniclerId : chroniclerName : ratingCount : ratingTotal : lastRatingTime : m_data[0..19]
 * so colon field [0]="v3", [1]=oid, [2]=name, [3]=ratingCount, [4]=ratingTotal,
 * [5]=lastRatingTime, and [6..25] are the 20 PgcRatingData slots. The slot->stat
 * mapping used below ([10]+[11] created, [13]+[14] rated, [16]+[17] completed) is
 * SOE's own. Returns null for a non-v3 or nameless value so callers can filter.
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
    questsCreated: num(10) + num(11),
    questsCompleted: num(16) + num(17),
    ratingCount: num(3),
    ratingTotal: num(4),
    ratedQuestCount: num(13) + num(14),
  };
}

@Service()
export class ChroniclesService {
  async getChroniclers(): Promise<ChroniclerStatsRow[]> {
    // The single aggregator object whose overloaded Citizens (LIST_ID 13) list
    // holds the chronicler meta-records.
    const cityObject = await knexDb.first().from<CityObjectRecord>('CITY_OBJECTS');
    if (!cityObject) return [];

    // Pull only the chronicler meta-records, not the per-city citizen rows that
    // share LIST_ID 13. The (OBJECT_ID, LIST_ID, VALUE) primary key turns this
    // into an index range scan - equality on the first two columns, a left-anchored
    // `v3:` prefix on the third - so the DB returns just the chronicler rows, never
    // the (far more numerous) citizen rows. One short row per chronicler, parsed
    // in memory.
    const rows = await knexDb<PropertyListValueRecord>('PROPERTY_LISTS')
      .select('VALUE')
      .where('OBJECT_ID', cityObject.OBJECT_ID)
      .andWhere('LIST_ID', PropertyListIds.Citizens)
      .andWhere('VALUE', 'like', 'v3:%');

    return rows.map(row => parseChroniclerValue(row.VALUE)).filter((r): r is ChroniclerStatsRow => r !== null);
  }
}
