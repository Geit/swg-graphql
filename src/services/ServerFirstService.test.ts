import { describe, it, expect, vi, beforeEach } from 'vitest';

import { DataTableService } from './DataTableService';
import { ObjVarService } from './ObjVarService';
import { PlanetObjectService } from './PlanetObjectService';
import { ServerFirstService, parseServerFirstValue } from './ServerFirstService';
import { StringFileLoader } from './StringFileLoader';

vi.mock('./db');

// parseServerFirstValue decodes the collectionServerFirst.* objvar value, a
// STRING_ARRAY of [unixSeconds, characterOid, characterName] (confirmed live).
describe('parseServerFirstValue', () => {
  it('decodes the [unixSeconds, oid, name] string array', () => {
    expect(parseServerFirstValue(['1620521518', '264553502281', 'Syrus Dyre'])).toEqual({
      characterName: 'Syrus Dyre',
      characterOid: '264553502281',
      dateCompleted: new Date(1620521518 * 1000).toISOString(),
    });
  });

  it('accepts a bare string as just the character name', () => {
    expect(parseServerFirstValue('Han Solo')).toEqual({
      characterName: 'Han Solo',
      characterOid: null,
      dateCompleted: null,
    });
  });

  it('yields nulls for an unrecognized value instead of throwing', () => {
    expect(parseServerFirstValue(null)).toEqual({ characterName: null, characterOid: null, dateCompleted: null });
    expect(parseServerFirstValue(42)).toEqual({ characterName: null, characterOid: null, dateCompleted: null });
  });
});

describe('ServerFirstService', () => {
  let service: ServerFirstService;
  let mockPlanetObjects: { getObjectIdByPlanetName: ReturnType<typeof vi.fn> };
  let mockObjVars: { getObjVarsForObject: ReturnType<typeof vi.fn> };
  let mockDataTable: { load: ReturnType<typeof vi.fn> };
  let mockStrings: { tryLoadFromRef: ReturnType<typeof vi.fn> };

  // The objvar value shape live data uses: [unixSeconds, characterOid, characterName].
  const wedge = ['1620521518', '264553502281', 'Wedge Antilles'];
  const wedgeDate = new Date(1620521518 * 1000).toISOString();
  const completion = { characterName: 'Wedge Antilles', characterOid: '264553502281', dateCompleted: wedgeDate };

  beforeEach(() => {
    mockPlanetObjects = { getObjectIdByPlanetName: vi.fn().mockResolvedValue('8000') };
    mockObjVars = { getObjVarsForObject: vi.fn().mockResolvedValue([]) };
    mockDataTable = { load: vi.fn().mockResolvedValue([]) };
    mockStrings = { tryLoadFromRef: vi.fn().mockResolvedValue(null) };

    service = new ServerFirstService(
      mockPlanetObjects as unknown as PlanetObjectService,
      mockObjVars as unknown as ObjVarService,
      mockDataTable as unknown as DataTableService,
      mockStrings as unknown as StringFileLoader
    );
  });

  it('returns [] when the Tatooine planet object cannot be resolved', async () => {
    mockPlanetObjects.getObjectIdByPlanetName.mockResolvedValueOnce(null);

    expect(await service.getServerFirsts()).toEqual([]);
    expect(mockObjVars.getObjVarsForObject).not.toHaveBeenCalled();
  });

  it('filters to collectionServerFirst.* objvars and maps display names from collection.iff', async () => {
    mockObjVars.getObjVarsForObject.mockResolvedValueOnce([
      { name: 'someOther.objvar', type: 5, value: ['ignore', 'me'] },
      { name: 'collectionServerFirst.master_pilot', type: 5, value: wedge },
    ]);
    mockDataTable.load.mockResolvedValueOnce([{ name: 'master_pilot', stringName: 'master_pilot', category: 'pilot' }]);
    mockStrings.tryLoadFromRef.mockResolvedValueOnce('Master Pilot');

    const result = await service.getServerFirsts();

    expect(result).toEqual([
      { collectionName: 'master_pilot', displayName: 'Master Pilot', category: 'pilot', ...completion },
    ]);
    expect(mockStrings.tryLoadFromRef).toHaveBeenCalledWith('collection_n:master_pilot');
  });

  it('keeps the raw collection name when the datatable read fails', async () => {
    mockObjVars.getObjVarsForObject.mockResolvedValueOnce([
      { name: 'collectionServerFirst.master_pilot', type: 5, value: wedge },
    ]);
    mockDataTable.load.mockRejectedValueOnce(new Error('collection.iff missing'));

    const result = await service.getServerFirsts();

    expect(result).toEqual([{ collectionName: 'master_pilot', displayName: null, category: null, ...completion }]);
  });

  it('sorts newest-dated first, then undated alphabetically last', async () => {
    mockObjVars.getObjVarsForObject.mockResolvedValueOnce([
      { name: 'collectionServerFirst.b_coll', type: 5, value: ['1600000000', 'o1', 'Beta'] },
      { name: 'collectionServerFirst.a_coll', type: 5, value: ['1700000000', 'o2', 'Alpha'] },
      { name: 'collectionServerFirst.c_coll', type: 5, value: ['', 'o3', 'Gamma'] },
    ]);

    const result = await service.getServerFirsts();

    expect(result.map(r => r.collectionName)).toEqual(['a_coll', 'b_coll', 'c_coll']);
  });
});
