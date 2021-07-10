import DataLoader from 'dataloader';
import { Service } from 'typedi';

import knexDb from './db';

/**
 * Derived from building_objects.tab
 *
 * See {@link BuildingObject} for descriptions of each field.
 */
interface BuildingObjectRecord {
  OBJECT_ID: string;
  MAINTENANCE_COST: number | null;
  TIME_LAST_CHECKED: number | null;
  IS_PUBLIC: string | null;
  CITY_ID: string | null;
}

@Service()
export class BuildingObjectService {
  private dataloader = new DataLoader(BuildingObjectService.batchFunction);
  load = this.dataloader.load.bind(this.dataloader);

  static async batchFunction(keys: readonly string[]) {
    const results = await knexDb.select().from<BuildingObjectRecord>('BUILDING_OBJECTS').whereIn('OBJECT_ID', keys);

    return keys.map(key => results.find(result => result.OBJECT_ID === key));
  }
}
