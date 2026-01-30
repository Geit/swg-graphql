import { describe, it, expect, vi, beforeEach } from 'vitest';

import { NameResolutionService } from '../services/NameResolutionService';
import { ResourceContainerObjectService } from '../services/ResourceContainerObjectService';
import { ResourceTypeService } from '../services/ResourceTypeService';
import { IServerObject } from '../types';

import { ResourceContainerObjectResolver } from './ResourceContainerObjectResolver';
import { ResourceTypeResolver } from './ResourceTypeResolver';

describe('ResourceContainerObjectResolver', () => {
  let resolver: ResourceContainerObjectResolver;
  let mockNameResolutionService: { resolveName: ReturnType<typeof vi.fn> };
  let mockResourceTypeService: { getOne: ReturnType<typeof vi.fn> };
  let mockRcObjectService: { load: ReturnType<typeof vi.fn> };
  let mockResourceTypeResolvers: { className: ReturnType<typeof vi.fn> };

  const createMockObject = (id: string): IServerObject =>
    ({
      id,
    }) as IServerObject;

  beforeEach(() => {
    mockNameResolutionService = {
      resolveName: vi.fn().mockResolvedValue('Resolved Name'),
    };

    mockResourceTypeService = {
      getOne: vi.fn().mockResolvedValue(null),
    };

    mockRcObjectService = {
      load: vi.fn().mockResolvedValue(null),
    };

    mockResourceTypeResolvers = {
      className: vi.fn().mockResolvedValue(null),
    };

    resolver = new ResourceContainerObjectResolver();
    resolver.nameResolutionService = mockNameResolutionService as unknown as NameResolutionService;
    resolver.resourceTypeService = mockResourceTypeService as unknown as ResourceTypeService;
    resolver.rcObjectService = mockRcObjectService as unknown as ResourceContainerObjectService;
    resolver.resourceTypeResolvers = mockResourceTypeResolvers as unknown as ResourceTypeResolver;
  });

  describe('count', () => {
    it('should return quantity from loaded object', async () => {
      mockRcObjectService.load.mockResolvedValue({ QUANTITY: 500 });

      const result = await resolver.count(createMockObject('12345'));

      expect(mockRcObjectService.load).toHaveBeenCalledWith('12345');
      expect(result).toBe(500);
    });

    it('should return undefined when object not found', async () => {
      mockRcObjectService.load.mockResolvedValue(null);

      const result = await resolver.count(createMockObject('99999'));

      expect(result).toBeUndefined();
    });
  });

  describe('quantity', () => {
    it('should return quantity from loaded object', async () => {
      mockRcObjectService.load.mockResolvedValue({ QUANTITY: 1000 });

      const result = await resolver.quantity(createMockObject('12345'));

      expect(result).toBe(1000);
    });
  });

  describe('resourceTypeId', () => {
    it('should return resource type ID from loaded object', async () => {
      mockRcObjectService.load.mockResolvedValue({ RESOURCE_TYPE: 54321 });

      const result = await resolver.resourceTypeId(createMockObject('12345'));

      expect(result).toBe(54321);
    });
  });

  describe('resourceType', () => {
    it('should fetch resource type from service', async () => {
      const mockResourceType = { id: '54321', name: 'Iron' };
      mockRcObjectService.load.mockResolvedValue({ RESOURCE_TYPE: 54321 });
      mockResourceTypeService.getOne.mockResolvedValue(mockResourceType);

      const result = await resolver.resourceType(createMockObject('12345'));

      expect(mockResourceTypeService.getOne).toHaveBeenCalledWith('54321');
      expect(result).toEqual(mockResourceType);
    });

    it('should return null when no resource type', async () => {
      mockRcObjectService.load.mockResolvedValue({ RESOURCE_TYPE: null });

      const result = await resolver.resourceType(createMockObject('12345'));

      expect(result).toBeNull();
    });

    it('should return null when object not found', async () => {
      mockRcObjectService.load.mockResolvedValue(null);

      const result = await resolver.resourceType(createMockObject('12345'));

      expect(result).toBeNull();
    });
  });

  describe('source', () => {
    it('should return source from loaded object', async () => {
      mockRcObjectService.load.mockResolvedValue({ SOURCE: 'harvester' });

      const result = await resolver.source(createMockObject('12345'));

      expect(result).toBe('harvester');
    });
  });

  describe('resolvedName', () => {
    it('should return formatted resource name when resolveCustomNames is true and resource exists', async () => {
      const mockResourceType = { id: '54321', name: 'Lokian Iron' };
      mockRcObjectService.load.mockResolvedValue({ RESOURCE_TYPE: 54321 });
      mockResourceTypeService.getOne.mockResolvedValue(mockResourceType);
      mockResourceTypeResolvers.className.mockResolvedValue('Iron');

      const result = await resolver.resolvedName(createMockObject('12345'), true);

      expect(result).toBe('Iron (Lokian Iron)');
    });

    it('should fall back to name resolution when no resource type found', async () => {
      mockRcObjectService.load.mockResolvedValue({ RESOURCE_TYPE: null });
      mockNameResolutionService.resolveName.mockResolvedValue('Resource Container');

      const result = await resolver.resolvedName(createMockObject('12345'), true);

      expect(mockNameResolutionService.resolveName).toHaveBeenCalled();
      expect(result).toBe('Resource Container');
    });

    it('should use name resolution when resolveCustomNames is false', async () => {
      mockNameResolutionService.resolveName.mockResolvedValue('Generic Name');

      const result = await resolver.resolvedName(createMockObject('12345'), false);

      expect(mockNameResolutionService.resolveName).toHaveBeenCalledWith(expect.anything(), false);
      expect(result).toBe('Generic Name');
    });
  });
});
