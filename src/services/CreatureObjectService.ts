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
  ATTRIBUTE_0: number | null;
  ATTRIBUTE_1: number | null;
  ATTRIBUTE_2: number | null;
  ATTRIBUTE_3: number | null;
  ATTRIBUTE_4: number | null;
  ATTRIBUTE_5: number | null;
  ATTRIBUTE_6: number | null;
  ATTRIBUTE_7: number | null;
  ATTRIBUTE_8: number | null;
  ATTRIBUTE_9: number | null;
  ATTRIBUTE_10: number | null;
  ATTRIBUTE_11: number | null;
  ATTRIBUTE_12: number | null;
  ATTRIBUTE_13: number | null;
  ATTRIBUTE_14: number | null;
  ATTRIBUTE_15: number | null;
  ATTRIBUTE_16: number | null;
  ATTRIBUTE_17: number | null;
  ATTRIBUTE_18: number | null;
  ATTRIBUTE_19: number | null;
  ATTRIBUTE_20: number | null;
  ATTRIBUTE_21: number | null;
  ATTRIBUTE_22: number | null;
  ATTRIBUTE_23: number | null;
  ATTRIBUTE_24: number | null;
  ATTRIBUTE_25: number | null;
  ATTRIBUTE_26: number | null;
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
