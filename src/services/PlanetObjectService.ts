import DataLoader from 'dataloader';
import { Service } from 'typedi';

import knexDb from './db';

/**
 * Derived from planet_objects.tab
 *
 * See {@link PlanetObject} for descriptions of each field.
 */
interface PlanetObjectRecord {
  OBJECT_ID: number;
  PLANET_NAME: string | null;
}

@Service()
export class PlanetObjectService {
  private dataloader = new DataLoader(PlanetObjectService.batchFunction, { maxBatchSize: 999, cache: false });
  load = this.dataloader.load.bind(this.dataloader);

  static async batchFunction(keys: readonly string[]) {
    const results = await knexDb.select().from<PlanetObjectRecord>('PLANET_OBJECTS').whereIn('OBJECT_ID', keys);

    return keys.map(key => results.find(result => String(result.OBJECT_ID) === key));
  }
}
