import DataLoader from 'dataloader';
import { Service } from 'typedi';

import knexDb from './db';

/**
 * Derived from weapon_objects.tab
 *
 * See {@link WeaponObject} for descriptions of each field.
 */
interface WeaponObjectRecord {
  OBJECT_ID: number;
  MIN_DAMAGE: number;
  MAX_DAMAGE: number;
  DAMAGE_TYPE: number;
  ELEMENTAL_TYPE: number;
  ELEMENTAL_VALUE: number;
  ATTACK_SPEED: number;
  WOUND_CHANCE: number;
  ACCURACY: number;
  ATTACK_COST: number;
  DAMAGE_RADIUS: number;
  MIN_RANGE: number;
  MAX_RANGE: number;
}

@Service()
export class WeaponObjectService {
  private dataloader = new DataLoader(WeaponObjectService.batchFunction);
  load = this.dataloader.load.bind(this.dataloader);

  static async batchFunction(keys: readonly string[]) {
    const results = await knexDb.select().from<WeaponObjectRecord>('WEAPON_OBJECTS').whereIn('OBJECT_ID', keys);

    return keys.map(key => results.find(result => String(result.OBJECT_ID) === key));
  }
}
