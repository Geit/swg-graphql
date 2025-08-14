import DataLoader from 'dataloader';
import { Service } from 'typedi';

import knexDb from './db';
import { ObjVarService, stringArrayObjvar } from './ObjVarService';
import { ServerObjectService } from './ServerObjectService';

/**
 * Derived from building_objects.tab
 *
 * See {@link BuildingObject} for descriptions of each field.
 */
interface BuildingObjectRecord {
  OBJECT_ID: number;
  MAINTENANCE_COST: number | null;
  TIME_LAST_CHECKED: number | null;
  IS_PUBLIC: string | null;
  CITY_ID: string | null;
}

@Service()
export class BuildingObjectService {
  constructor(
    // constructor injection of a service
    private readonly objvarService: ObjVarService,
    private readonly objectService: ServerObjectService
  ) {
    // Do nothing
  }

  private dataloader = new DataLoader(BuildingObjectService.batchFunction, { maxBatchSize: 999, cache: false });
  load = this.dataloader.load.bind(this.dataloader);

  static async batchFunction(keys: readonly string[]) {
    const results = await knexDb.select().from<BuildingObjectRecord>('BUILDING_OBJECTS').whereIn('OBJECT_ID', keys);

    return keys.map(key => results.find(result => String(result.OBJECT_ID) === key));
  }

  async fetchObjvarAccessList(objectId: string, objVar: string) {
    // Fetch from VAR_ADMIN_LIST. Can only be PlayerCharacterObjects in practice, but the
    // data store will allow guilds too.
    const objvars = await this.objvarService.getObjVarsForObject(objectId);

    const adminList = objvars.find(stringArrayObjvar(objVar));

    return this.objectService.getMany({ objectIds: adminList?.value ?? [] });
  }
}
