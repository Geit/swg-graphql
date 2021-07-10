import DataLoader from 'dataloader';
import { Service } from 'typedi';

import knexDb from './db';

/**
 * Derived from installation_objects.tab
 *
 * See {@link IInstallationObject} for descriptions of each field.
 */
interface InstallationObjectRecord {
  OBJECT_ID: string;
  INSTALLATION_TYPE: number | null;
  ACTIVATED: string | null;
  TICK_COUNT: number | null;
  ACTIVATE_START_TIME: number | null;
  POWER: number | null;
  POWER_RATE: number | null;
}

@Service()
export class InstallationObjectService {
  private dataloader = new DataLoader(InstallationObjectService.batchFunction);
  load = this.dataloader.load.bind(this.dataloader);

  static async batchFunction(keys: readonly string[]) {
    const results = await knexDb
      .select()
      .from<InstallationObjectRecord>('INSTALLATION_OBJECTS')
      .whereIn('OBJECT_ID', keys);

    return keys.map(key => results.find(result => result.OBJECT_ID === key));
  }
}
