import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ChroniclesService, parseChroniclerValue } from './ChroniclesService';

// Shared, test-settable DB results. vi.hoisted so the vi.mock factory (hoisted
// above the imports) can close over them.
const dbState = vi.hoisted(() => ({
  cityObject: undefined as { OBJECT_ID: number } | undefined,
  v3Rows: [] as { VALUE: string }[],
}));

vi.mock('./db', () => {
  // knexDb('PROPERTY_LISTS').select().where().andWhere().andWhere() -> awaited rows.
  const queryBuilder = () => {
    const builder: Record<string, unknown> = {};
    const chain = () => builder;
    builder.select = vi.fn(chain);
    builder.where = vi.fn(chain);
    builder.andWhere = vi.fn(chain);
    builder.then = (onF: (v: unknown) => unknown, onR?: (e: unknown) => unknown) =>
      Promise.resolve(dbState.v3Rows).then(onF, onR);
    return builder;
  };
  const knexFn = vi.fn(() => queryBuilder()) as unknown as { (table: string): unknown; first: () => unknown };
  // knexDb.first().from('CITY_OBJECTS') -> awaited single row.
  knexFn.first = vi.fn(() => ({ from: () => Promise.resolve(dbState.cityObject) }));
  return { default: knexFn };
});

// Build a v3 record: [0]="v3", [1]=oid, [2]=name, [3]=rating count, [4]=rating sum,
// [10]+[11]=created, [13]+[14]=rated, [16]+[17]=completed. 26 fields, rest "0".
function record(overrides: Record<number, string | number> = {}): string {
  const fields = Array.from({ length: 26 }, () => '0');
  fields[0] = 'v3';
  fields[1] = '264553502281';
  fields[2] = 'Wedge Antilles';
  for (const [i, v] of Object.entries(overrides)) fields[Number(i)] = String(v);
  return fields.join(':');
}

describe('parseChroniclerValue', () => {
  it('decodes name, summed created/completed buckets, and rating fields', () => {
    const value = record({ 3: 8, 4: 36, 10: 5, 11: 2, 13: 3, 14: 1, 16: 9, 17: 4 });

    expect(parseChroniclerValue(value)).toEqual({
      name: 'Wedge Antilles',
      characterOid: '264553502281',
      questsCreated: 7,
      questsCompleted: 13,
      ratingCount: 8,
      ratingTotal: 36,
      ratedQuestCount: 4,
    });
  });

  it('treats missing or non-numeric fields as 0', () => {
    expect(parseChroniclerValue('v3::Han Solo')).toEqual({
      name: 'Han Solo',
      characterOid: null,
      questsCreated: 0,
      questsCompleted: 0,
      ratingCount: 0,
      ratingTotal: 0,
      ratedQuestCount: 0,
    });
  });

  it('returns null for non-v3 records, nameless records, and empty values', () => {
    expect(parseChroniclerValue('v2:cityId:citizenId:Some Citizen:tmpl:90')).toBeNull();
    expect(parseChroniclerValue('')).toBeNull();
    expect(parseChroniclerValue(record({ 2: '' }))).toBeNull();
  });
});

describe('ChroniclesService.getChroniclers', () => {
  let service: ChroniclesService;

  beforeEach(() => {
    service = new ChroniclesService();
    dbState.cityObject = { OBJECT_ID: 8000 };
    dbState.v3Rows = [];
  });

  it('returns [] without querying property lists when there is no city aggregator object', async () => {
    dbState.cityObject = undefined;

    expect(await service.getChroniclers()).toEqual([]);
  });

  it('decodes the v3 chronicler rows the indexed query returns', async () => {
    dbState.v3Rows = [
      { VALUE: record({ 1: '111', 2: 'Tycho Celchu', 10: 3, 11: 1, 16: 4, 17: 2 }) },
      { VALUE: record({ 1: '222', 2: 'Wedge Antilles', 3: 8, 4: 36, 13: 3, 14: 1 }) },
    ];

    const rows = await service.getChroniclers();

    expect(rows).toEqual([
      {
        name: 'Tycho Celchu',
        characterOid: '111',
        questsCreated: 4,
        questsCompleted: 6,
        ratingCount: 0,
        ratingTotal: 0,
        ratedQuestCount: 0,
      },
      {
        name: 'Wedge Antilles',
        characterOid: '222',
        questsCreated: 0,
        questsCompleted: 0,
        ratingCount: 8,
        ratingTotal: 36,
        ratedQuestCount: 4,
      },
    ]);
  });

  it('drops rows the parser rejects (e.g. a nameless record) without throwing', async () => {
    dbState.v3Rows = [{ VALUE: record({ 2: '' }) }, { VALUE: record({ 2: 'Kira Sung', 10: 2 }) }];

    const rows = await service.getChroniclers();

    expect(rows.map(r => r.name)).toEqual(['Kira Sung']);
  });
});
