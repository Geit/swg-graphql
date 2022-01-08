import DataLoader from 'dataloader';
import { Service } from 'typedi';

import knexDb from './db';

/**
 * Derived from harvester_installation_objects.tab
 *
 * See {@link HarvesterInstallationObject} for descriptions of each field.
 */
interface HarvesterInstallationObjectRecord {
  OBJECT_ID: number;
  INSTALLED_EFFICIENCY: number | null;
  MAX_EXTRACTION_RATE: number | null;
  CURRENT_EXTRACTION_RATE: number | null;
  MAX_HOPPER_AMOUNT: number | null;
  HOPPER_RESOURCE: number | null;
  HOPPER_AMOUNT: number | null;
  RESOURCE_TYPE: string | null;
}

@Service()
export class HarvesterInstallationObjectService {
  private dataloader = new DataLoader(HarvesterInstallationObjectService.batchFunction);
  load = this.dataloader.load.bind(this.dataloader);

  static async batchFunction(keys: readonly string[]) {
    const results = await knexDb
      .select()
      .from<HarvesterInstallationObjectRecord>('HARVESTER_INSTALLATION_OBJECTS')
      .whereIn('OBJECT_ID', keys);

    return keys.map(key => results.find(result => String(result.OBJECT_ID) === key));
  }
}
