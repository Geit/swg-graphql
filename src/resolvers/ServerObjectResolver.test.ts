import { describe, it, expect, vi, beforeEach } from 'vitest';

import { CrcLookupService } from '../services/CrcLookupService';
import { NameResolutionService } from '../services/NameResolutionService';
import { ObjVarService } from '../services/ObjVarService';
import { PropertyListService } from '../services/PropertyListService';
import { ServerObjectService } from '../services/ServerObjectService';
import { StringFileLoader } from '../services/StringFileLoader';
import { IServerObject } from '../types';

import { ServerObjectResolver } from './ServerObjectResolver';

describe('ServerObjectResolver', () => {
  let resolver: ServerObjectResolver;
  let mockObjVarService: { getObjVarsForObject: ReturnType<typeof vi.fn> };
  let mockObjectService: {
    getMany: ReturnType<typeof vi.fn>;
    countMany: ReturnType<typeof vi.fn>;
    getOne: ReturnType<typeof vi.fn>;
  };
  let mockNameResolutionService: { resolveName: ReturnType<typeof vi.fn> };
  let mockPropertyListService: { load: ReturnType<typeof vi.fn> };
  let mockCrcLookup: { lookupCrc: ReturnType<typeof vi.fn> };
  let mockStringFileService: { load: ReturnType<typeof vi.fn> };

  const createMockObject = (overrides: Partial<IServerObject> = {}): IServerObject =>
    ({
      id: '12345',
      containedById: null,
      loadWithId: null,
      templateId: null,
      scene: null,
      ...overrides,
    }) as IServerObject;

  beforeEach(() => {
    mockObjVarService = {
      getObjVarsForObject: vi.fn().mockResolvedValue([]),
    };

    mockObjectService = {
      getMany: vi.fn().mockResolvedValue([]),
      countMany: vi.fn().mockResolvedValue(0),
      getOne: vi.fn().mockResolvedValue(null),
    };

    mockNameResolutionService = {
      resolveName: vi.fn().mockResolvedValue('Resolved Name'),
    };

    mockPropertyListService = {
      load: vi.fn().mockResolvedValue([]),
    };

    mockCrcLookup = {
      lookupCrc: vi.fn().mockResolvedValue(null),
    };

    mockStringFileService = {
      load: vi.fn().mockResolvedValue({}),
    };

    resolver = new ServerObjectResolver(
      mockObjVarService as unknown as ObjVarService,
      mockObjectService as unknown as ServerObjectService,
      mockNameResolutionService as unknown as NameResolutionService,
      mockPropertyListService as unknown as PropertyListService,
      mockCrcLookup as unknown as CrcLookupService,
      mockStringFileService as unknown as StringFileLoader
    );
  });

  describe('objVars', () => {
    it('should fetch objvars for object', async () => {
      const mockObjVars = [{ name: 'test', type: 0, value: 'value' }];
      mockObjVarService.getObjVarsForObject.mockResolvedValue(mockObjVars);

      const result = await resolver.objVars(createMockObject({ id: '12345' }));

      expect(mockObjVarService.getObjVarsForObject).toHaveBeenCalledWith('12345');
      expect(result).toEqual(mockObjVars);
    });
  });

  describe('contents', () => {
    it('should fetch contained objects with default options', async () => {
      const mockContents = [{ id: '111' }, { id: '222' }];
      mockObjectService.getMany.mockResolvedValue(mockContents);

      const result = await resolver.contents(createMockObject({ id: '12345' }), 500, false, false);

      expect(mockObjectService.getMany).toHaveBeenCalledWith({
        containedById: '12345',
        limit: 500,
        excludeDeleted: false,
      });
      expect(result).toEqual(mockContents);
    });

    it('should fetch contents recursively when recursive is true', async () => {
      mockObjectService.getMany.mockResolvedValue([]);

      await resolver.contents(createMockObject({ id: '12345' }), 100, true, true);

      expect(mockObjectService.getMany).toHaveBeenCalledWith({
        containedByIdRecursive: '12345',
        limit: 100,
        excludeDeleted: true,
      });
    });
  });

  describe('template', () => {
    it('should return template path for valid templateId', async () => {
      mockCrcLookup.lookupCrc.mockResolvedValue('object/creature/player/human_male.iff');

      const result = await resolver.template(createMockObject({ templateId: 12345 }));

      expect(mockCrcLookup.lookupCrc).toHaveBeenCalledWith(12345);
      expect(result).toBe('object/creature/player/human_male.iff');
    });

    it('should return null when no templateId', async () => {
      const result = await resolver.template(createMockObject({ templateId: null }));

      expect(result).toBeNull();
    });
  });

  describe('resolvedName', () => {
    it('should call name resolution service', async () => {
      mockNameResolutionService.resolveName.mockResolvedValue('Test Object');

      const obj = createMockObject({ id: '12345' });
      const result = await resolver.resolvedName(obj, true);

      expect(mockNameResolutionService.resolveName).toHaveBeenCalledWith(obj, true);
      expect(result).toBe('Test Object');
    });

    it('should pass resolveCustomNames parameter', async () => {
      const obj = createMockObject({ id: '12345' });
      await resolver.resolvedName(obj, false);

      expect(mockNameResolutionService.resolveName).toHaveBeenCalledWith(obj, false);
    });
  });

  describe('containedItemCount', () => {
    it('should count contained items excluding deleted', async () => {
      mockObjectService.countMany.mockResolvedValue(5);

      const result = await resolver.containedItemCount(createMockObject({ id: '12345' }));

      expect(mockObjectService.countMany).toHaveBeenCalledWith({
        containedById: '12345',
        excludeDeleted: true,
      });
      expect(result).toBe(5);
    });
  });

  describe('propertyLists', () => {
    it('should load property lists for object', async () => {
      const mockLists = [{ listId: 1, value: 'test' }];
      mockPropertyListService.load.mockResolvedValue(mockLists);

      const result = await resolver.propertyLists(createMockObject({ id: '12345' }), null);

      expect(mockPropertyListService.load).toHaveBeenCalledWith({
        objectId: '12345',
        listId: null,
      });
      expect(result).toEqual(mockLists);
    });
  });

  describe('container', () => {
    it('should fetch container object', async () => {
      const mockContainer = { id: '111', name: 'Container' };
      mockObjectService.getOne.mockResolvedValue(mockContainer);

      const result = await resolver.container(createMockObject({ containedById: '111' }));

      expect(mockObjectService.getOne).toHaveBeenCalledWith('111');
      expect(result).toEqual(mockContainer);
    });

    it('should return null when no containedById', async () => {
      const result = await resolver.container(createMockObject({ containedById: null }));

      expect(result).toBeNull();
    });

    it('should return null when containedById is negative', async () => {
      const result = await resolver.container(createMockObject({ containedById: '-1' }));

      expect(result).toBeNull();
    });
  });

  describe('loadsWith', () => {
    it('should fetch loadsWith object', async () => {
      const mockLoadsWith = { id: '222', name: 'LoadsWith' };
      mockObjectService.getOne.mockResolvedValue(mockLoadsWith);

      const result = await resolver.loadsWith(createMockObject({ loadWithId: '222' }));

      expect(mockObjectService.getOne).toHaveBeenCalledWith('222');
      expect(result).toEqual(mockLoadsWith);
    });

    it('should return null when no loadWithId', async () => {
      const result = await resolver.loadsWith(createMockObject({ loadWithId: null }));

      expect(result).toBeNull();
    });
  });

  describe('sceneName', () => {
    it('should return resolved planet name', async () => {
      mockStringFileService.load.mockResolvedValue({
        tatooine: 'Tatooine',
      });

      const result = await resolver.sceneName(createMockObject({ scene: 'tatooine' }));

      expect(mockStringFileService.load).toHaveBeenCalledWith('planet_n');
      expect(result).toBe('Tatooine');
    });

    it('should return scene id when not in string file', async () => {
      mockStringFileService.load.mockResolvedValue({});

      const result = await resolver.sceneName(createMockObject({ scene: 'unknown_planet' }));

      expect(result).toBe('unknown_planet');
    });

    it('should return null when no scene', async () => {
      const result = await resolver.sceneName(createMockObject({ scene: null }));

      expect(result).toBeNull();
    });
  });
});
