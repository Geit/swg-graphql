import { describe, it, expect, vi, beforeEach } from 'vitest';

import { DynamicVariableType } from '../types/ObjVar';

import { ObjVarService, stringArrayObjvar, networkIdArrayObjvar, stringObjvar, floatObjvar } from './ObjVarService';
import { tracker } from './__mocks__/db';

type ObjVar =
  | { name: string; type: DynamicVariableType.STRING; value: string }
  | { name: string; type: DynamicVariableType.STRING_ARRAY; value: string[] }
  | { name: string; type: DynamicVariableType.NETWORK_ID; value: string }
  | { name: string; type: DynamicVariableType.NETWORK_ID_ARRAY; value: string[] }
  | { name: string; type: DynamicVariableType.REAL; value: number }
  | { name: string; type: DynamicVariableType.REAL_ARRAY; value: number[] }
  | { name: string; type: DynamicVariableType.INT; value: number }
  | { name: string; type: DynamicVariableType.INT_ARRAY; value: number[] };

vi.mock('./db');

describe('ObjVarService', () => {
  let service: ObjVarService;

  beforeEach(() => {
    tracker.reset();
    service = new ObjVarService();
  });

  describe('getObjVarsForObject', () => {
    it('should query OBJECT_VARIABLES_VIEW and convert results', async () => {
      const mockResults = [
        { NAME: 'test_string', TYPE: DynamicVariableType.STRING, VALUE: 'hello' },
        { NAME: 'test_int', TYPE: DynamicVariableType.INT, VALUE: '42' },
      ];
      tracker.on.select('OBJECT_VARIABLES_VIEW').response(mockResults);

      const result = await service.getObjVarsForObject('12345');

      const query = tracker.history.select[0];
      expect(query.sql).toContain('OBJECT_VARIABLES_VIEW');
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no objvars found', async () => {
      tracker.on.select('OBJECT_VARIABLES_VIEW').response([]);

      const result = await service.getObjVarsForObject('99999');

      expect(result).toEqual([]);
    });
  });

  describe('convertObjVar', () => {
    it('should convert INT type to number', () => {
      const result = ObjVarService.convertObjVar('test', DynamicVariableType.INT, '42');

      expect(result).toEqual({
        name: 'test',
        type: DynamicVariableType.INT,
        value: 42,
      });
    });

    it('should convert REAL type to number', () => {
      const result = ObjVarService.convertObjVar('test', DynamicVariableType.REAL, '3.14');

      expect(result).toEqual({
        name: 'test',
        type: DynamicVariableType.REAL,
        value: 3.14,
      });
    });

    it('should convert INT_ARRAY type to number array', () => {
      const result = ObjVarService.convertObjVar('test', DynamicVariableType.INT_ARRAY, '1:2:3:');

      expect(result).toEqual({
        name: 'test',
        type: DynamicVariableType.INT_ARRAY,
        value: [1, 2, 3],
      });
    });

    it('should convert REAL_ARRAY type to number array', () => {
      const result = ObjVarService.convertObjVar('test', DynamicVariableType.REAL_ARRAY, '1.1:2.2:3.3:');

      expect(result).toEqual({
        name: 'test',
        type: DynamicVariableType.REAL_ARRAY,
        value: [1.1, 2.2, 3.3],
      });
    });

    it('should convert STRING_ARRAY type to string array', () => {
      const result = ObjVarService.convertObjVar('test', DynamicVariableType.STRING_ARRAY, 'a:b:c:');

      expect(result).toEqual({
        name: 'test',
        type: DynamicVariableType.STRING_ARRAY,
        value: ['a', 'b', 'c'],
      });
    });

    it('should convert NETWORK_ID_ARRAY type to string array', () => {
      const result = ObjVarService.convertObjVar('test', DynamicVariableType.NETWORK_ID_ARRAY, '111:222:333:');

      expect(result).toEqual({
        name: 'test',
        type: DynamicVariableType.NETWORK_ID_ARRAY,
        value: ['111', '222', '333'],
      });
    });

    it('should convert STRING type to string', () => {
      const result = ObjVarService.convertObjVar('test', DynamicVariableType.STRING, 'hello world');

      expect(result).toEqual({
        name: 'test',
        type: DynamicVariableType.STRING,
        value: 'hello world',
      });
    });

    it('should convert NETWORK_ID type to string', () => {
      const result = ObjVarService.convertObjVar('test', DynamicVariableType.NETWORK_ID, '123456789');

      expect(result).toEqual({
        name: 'test',
        type: DynamicVariableType.NETWORK_ID,
        value: '123456789',
      });
    });

    it('should handle empty arrays', () => {
      const result = ObjVarService.convertObjVar('test', DynamicVariableType.INT_ARRAY, '');

      expect(result).toEqual({
        name: 'test',
        type: DynamicVariableType.INT_ARRAY,
        value: [],
      });
    });
  });

  describe('type guard helpers', () => {
    describe('stringArrayObjvar', () => {
      it('should return true for matching STRING_ARRAY objvar', () => {
        const guard = stringArrayObjvar('test_array');
        const objvar = { name: 'test_array', type: DynamicVariableType.STRING_ARRAY, value: ['a', 'b'] };

        expect(guard(objvar as ObjVar)).toBe(true);
      });

      it('should return false for non-matching name', () => {
        const guard = stringArrayObjvar('test_array');
        const objvar = { name: 'other', type: DynamicVariableType.STRING_ARRAY, value: ['a'] };

        expect(guard(objvar as ObjVar)).toBe(false);
      });

      it('should return false for non-matching type', () => {
        const guard = stringArrayObjvar('test_array');
        const objvar = { name: 'test_array', type: DynamicVariableType.STRING, value: 'test' };

        expect(guard(objvar as ObjVar)).toBe(false);
      });
    });

    describe('networkIdArrayObjvar', () => {
      it('should return true for matching NETWORK_ID_ARRAY objvar', () => {
        const guard = networkIdArrayObjvar('ids');
        const objvar = { name: 'ids', type: DynamicVariableType.NETWORK_ID_ARRAY, value: ['111', '222'] };

        expect(guard(objvar as ObjVar)).toBe(true);
      });
    });

    describe('stringObjvar', () => {
      it('should return true for matching STRING objvar', () => {
        const guard = stringObjvar('name');
        const objvar = { name: 'name', type: DynamicVariableType.STRING, value: 'test' };

        expect(guard(objvar as ObjVar)).toBe(true);
      });
    });

    describe('floatObjvar', () => {
      it('should return true for matching REAL objvar', () => {
        const guard = floatObjvar('rate');
        const objvar = { name: 'rate', type: DynamicVariableType.REAL, value: 1.5 };

        expect(guard(objvar as ObjVar)).toBe(true);
      });
    });
  });
});
