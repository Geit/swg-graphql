import DataLoader from 'dataloader';
import { Service } from 'typedi';

import knexDb from './db';

/**
 * Derived from creature_objects.tab
 *
 * See {@link CreatureObject} for descriptions of each field.
 */
interface CreatureObjectRecord {
  OBJECT_ID: string;
  SCALE_FACTOR: number | null;
  STATES: number | null;
  POSTURE: number | null;
  SHOCK_WOUNDS: number | null;
  MASTER_ID: string | null;
  RANK: number | null;
  BASE_WALK_SPEED: number | null;
  BASE_RUN_SPEED: number | null;
  [attributeName: `ATTRIBUTE_${number}`]: number | null | undefined;
  PERSISTED_BUFFS: string;
  WS_X: number | null;
  WS_Y: number | null;
  WS_Z: number | null;
}

@Service()
export class CreatureObjectService {
  private dataloader = new DataLoader(CreatureObjectService.batchFunction);
  load = this.dataloader.load.bind(this.dataloader);

  static async batchFunction(keys: readonly string[]) {
    const results = await knexDb.select().from<CreatureObjectRecord>('CREATURE_OBJECTS').whereIn('OBJECT_ID', keys);

    return keys.map(key => results.find(result => result.OBJECT_ID === key));
  }
}
