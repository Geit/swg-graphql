import DataLoader from 'dataloader';
import { Service } from 'typedi';

import knexDb from './db';

/**
 * Derived from manf_schematic_objects.tab
 *
 * See {@link ManfSchematicObject} for descriptions of each field.
 */
interface ManfSchematicObjectRecord {
  OBJECT_ID: string;
  CREATOR_ID: string | null;
  CREATOR_NAME: string | null;
  ITEMS_PER_CONTAINER: number | null;
  MANUFACTURE_TIME: number | null;
  DRAFT_SCHEMATIC: number | null;
}

@Service()
export class ManfSchematicObjectService {
  private dataloader = new DataLoader(ManfSchematicObjectService.batchFunction);
  load = this.dataloader.load.bind(this.dataloader);

  static async batchFunction(keys: readonly string[]) {
    const results = await knexDb.select().from<ManfSchematicObjectRecord>('MANF_SCHEMATIC').whereIn('OBJECT_ID', keys);

    return keys.map(key => results.find(result => result.OBJECT_ID === key));
  }
}
