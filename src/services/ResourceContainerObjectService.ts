import DataLoader from 'dataloader';
import { Service } from 'typedi';

import knexDb from './db';

/**
 * Derived from resource_container_objects.tab
 *
 * See {@link ResourceContainerObject} for descriptions of each field.
 */
interface ResourceContainerObjectRecord {
  OBJECT_ID: string;
  RESOURCE_TYPE: string | null;
  QUANTITY: number | null;
  SOURCE: string | null;
}

@Service()
export class ResourceContainerObjectService {
  private dataloader = new DataLoader(ResourceContainerObjectService.batchFunction);
  load = this.dataloader.load.bind(this.dataloader);

  static async batchFunction(keys: readonly string[]) {
    const results = await knexDb
      .select()
      .from<ResourceContainerObjectRecord>('RESOURCE_CONTAINER_OBJECTS')
      .whereIn('OBJECT_ID', keys);

    return keys.map(key => results.find(result => result.OBJECT_ID === key));
  }
}
