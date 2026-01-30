import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ObjVarService } from './ObjVarService';
import { PlayerCreatureObjectService } from './PlayerCreatureObjectService';
import { tracker } from './__mocks__/db';

vi.mock('./db');

describe('PlayerCreatureObjectService', () => {
  let service: PlayerCreatureObjectService;
  let mockObjVarService: { getObjVarsForObject: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    tracker.reset();

    mockObjVarService = {
      getObjVarsForObject: vi.fn().mockResolvedValue([]),
    };

    service = new PlayerCreatureObjectService(mockObjVarService as unknown as ObjVarService);
  });

  describe('getPlayerRecordForCharacter', () => {
    it('should query PLAYERS table for character', async () => {
      const mockPlayer = {
        STATION_ID: 1001,
        CREATE_TIME: new Date('2024-01-01'),
        LAST_LOGIN_TIME: new Date('2024-01-15'),
      };
      tracker.on.select('PLAYERS').response(mockPlayer);

      const result = await service.getPlayerRecordForCharacter('12345');

      const query = tracker.history.select[0];
      expect(query.sql).toContain('PLAYERS');
      expect(result).toEqual(mockPlayer);
    });

    it('should return undefined when player not found', async () => {
      tracker.on.select('PLAYERS').response(undefined);

      const result = await service.getPlayerRecordForCharacter('99999');

      expect(result).toBeUndefined();
    });
  });

  describe('getRecentlyLoggedInCharacters', () => {
    it('should query PLAYERS with time filter', async () => {
      const mockPlayers = [
        { CHARACTER_OBJECT: 12345, STATION_ID: 1001, LAST_LOGIN_TIME: new Date() },
        { CHARACTER_OBJECT: 67890, STATION_ID: 1002, LAST_LOGIN_TIME: new Date() },
      ];
      tracker.on.select('PLAYERS').response(mockPlayers);

      const result = await service.getRecentlyLoggedInCharacters(3600);

      const query = tracker.history.select[0];
      expect(query.sql).toContain('PLAYERS');
      expect(query.sql).toContain('LAST_LOGIN_TIME');
      expect(query.bindings).toContain(3600);
      expect(result).toEqual(mockPlayers);
    });

    it('should return empty array when no recent players found', async () => {
      tracker.on.select('PLAYERS').response([]);

      const result = await service.getRecentlyLoggedInCharacters(7200);

      expect(result).toEqual([]);
    });
  });

  describe('getCheapStructuresForCharacter', () => {
    it('should extract structure OIDs from objvars', async () => {
      const mockObjVars = [
        { name: 'structures.111', type: 0, value: 'some_value' },
        { name: 'structures.222', type: 0, value: 'some_value' },
        { name: 'other.var', type: 0, value: 'ignored' },
      ];
      mockObjVarService.getObjVarsForObject.mockResolvedValue(mockObjVars);

      const result = await service.getCheapStructuresForCharacter('12345');

      expect(mockObjVarService.getObjVarsForObject).toHaveBeenCalledWith('12345');
      expect(result).toEqual(['111', '222']);
    });

    it('should return empty array when no structure objvars found', async () => {
      mockObjVarService.getObjVarsForObject.mockResolvedValue([{ name: 'other.var', type: 0, value: 'test' }]);

      const result = await service.getCheapStructuresForCharacter('12345');

      expect(result).toEqual([]);
    });

    it('should handle objvars with no OID after prefix', async () => {
      mockObjVarService.getObjVarsForObject.mockResolvedValue([
        { name: 'structures.', type: 0, value: 'test' },
        { name: 'structures.123', type: 0, value: 'test' },
      ]);

      const result = await service.getCheapStructuresForCharacter('12345');

      // Empty string after 'structures.' should not be included
      expect(result).toEqual(['123']);
    });
  });
});
