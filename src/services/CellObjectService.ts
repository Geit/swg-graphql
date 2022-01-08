import DataLoader from 'dataloader';
import { Service } from 'typedi';

import knexDb from './db';

/**
 * Derived from cell_objects.tab
 *
 * See {@link CellObject} for descriptions of each field.
 */
interface CellObjectRecord {
  OBJECT_ID: number;
  CELL_NUMBER: number | null;
  IS_PUBLIC: string | null;
}

@Service()
export class CellObjectService {
  private dataloader = new DataLoader(CellObjectService.batchFunction);
  load = this.dataloader.load.bind(this.dataloader);

  static async batchFunction(keys: readonly string[]) {
    const results = await knexDb.select().from<CellObjectRecord>('CELL_OBJECTS').whereIn('OBJECT_ID', keys);

    return keys.map(key => results.find(result => String(result.OBJECT_ID) === key));
  }
}
