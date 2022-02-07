import DataLoader from 'dataloader';
import { Service } from 'typedi';

import { ResourceType, ResourceTypeAttribute, ResourceTypeFractalData } from '../types/ResourceType';

import knexDb from './db';

/**
 * Derived from resource_types.tab
 *
 * See {@link ResourceType} for descriptions of each field.
 */
interface ResourceTypeRecord {
  RESOURCE_ID: number;
  RESOURCE_NAME: string | null;
  RESOURCE_CLASS: string | null;
  DEPLETED_TIMESTAMP: number | null;
  FRACTAL_SEEDS: string | null;
  ATTRIBUTES: string | null;
}

interface GetManyFilters {
  limit: number;
  offset?: number;
}

@Service()
export class ResourceTypeService {
  private db = knexDb;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  prepareManyQuery(filters: Partial<GetManyFilters>) {
    const query = this.db.select().from<ResourceTypeRecord>('RESOURCE_TYPES').orderBy('RESOURCE_ID', 'desc');

    return query;
  }

  async getMany(filters: Partial<GetManyFilters>) {
    const query = this.prepareManyQuery(filters);

    query.limit(filters.limit ?? 50).offset(filters.offset ?? 0);

    const objects = await query;

    return objects?.map(ResourceTypeService.convertRecordToResourceType);
  }

  async countMany(filters: Partial<GetManyFilters>) {
    const query = this.prepareManyQuery(filters);
    const objects = await query.count('RESOURCE_ID', { as: 'count' });
    return Number(objects[0].count);
  }

  private static convertRecordToResourceType(record: ResourceTypeRecord): ResourceType {
    // res_decay_resist 697:res_flavor 932:res_potential_energy 874:res_quality 759:
    const attributes: ResourceTypeAttribute[] | null = record.ATTRIBUTES
      ? record.ATTRIBUTES.split(':')
          .filter(Boolean)
          .map(attr => {
            const [attributeId, value] = attr.split(' ');

            return {
              attributeId,
              value: parseInt(value, 10),
            };
          })
      : null;

    // 10000016 1138858556:10000016 1138858556:
    const fractalData: ResourceTypeFractalData[] | null = record.FRACTAL_SEEDS
      ? record.FRACTAL_SEEDS.split(':')
          .filter(Boolean)
          .map(attr => {
            const [planetId, seed] = attr.split(' ');

            return {
              planetId,
              seed: parseInt(seed, 10),
            };
          })
      : null;

    return {
      id: String(record.RESOURCE_ID),
      name: record.RESOURCE_NAME,
      resourceClassId: record.RESOURCE_CLASS,
      depletedTime:
        record.DEPLETED_TIMESTAMP && record.DEPLETED_TIMESTAMP >= 0
          ? new Date(record.DEPLETED_TIMESTAMP * 1000).toISOString()
          : null,
      attributes,
      fractalData,
    };
  }

  private dataloader = new DataLoader(ResourceTypeService.batchFunction, { cache: false });
  getOne = this.dataloader.load.bind(this.dataloader);

  static async batchFunction(keys: readonly string[]) {
    const results = await knexDb.select().from<ResourceTypeRecord>('RESOURCE_TYPES').whereIn('RESOURCE_ID', keys);

    return keys.map(key => {
      const foundRecord = results.find(result => String(result.RESOURCE_ID) === key);

      return foundRecord ? ResourceTypeService.convertRecordToResourceType(foundRecord) : null;
    });
  }
}
