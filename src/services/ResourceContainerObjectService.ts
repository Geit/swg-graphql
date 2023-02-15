import DataLoader from 'dataloader';
import { Service } from 'typedi';

import knexDb from './db';

/**
 * Derived from resource_container_objects.tab
 *
 * See {@link ResourceContainerObject} for descriptions of each field.
 */
interface ResourceContainerObjectRecord {
  OBJECT_ID: number;
  RESOURCE_TYPE: number | null;
  QUANTITY: number | null;
  SOURCE: string | null;
}

@Service()
export class ResourceContainerObjectService {
  async getCirculationAmountForResourceTypeId(typeId: number) {
    const result = await knexDb
      .first()
      .from<ResourceContainerObjectRecord>('RESOURCE_CONTAINER_OBJECTS')
      .sum('QUANTITY')
      .count()
      .where('RESOURCE_TYPE', typeId);

    return {
      totalQuantity: result['SUM("QUANTITY")'] ?? 0,
      containerObjects: result['COUNT(*)'],
    };
  }

  private dataloader = new DataLoader(ResourceContainerObjectService.batchFunction, {
    maxBatchSize: 999,
    cache: false,
  });
  load = this.dataloader.load.bind(this.dataloader);

  static async batchFunction(keys: readonly string[]) {
    const results = await knexDb
      .select()
      .from<ResourceContainerObjectRecord>('RESOURCE_CONTAINER_OBJECTS')
      .whereIn('OBJECT_ID', keys);

    return keys.map(key => results.find(result => String(result.OBJECT_ID) === key));
  }
}
