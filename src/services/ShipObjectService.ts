import DataLoader from 'dataloader';
import { Service } from 'typedi';

import knexDb from './db';

/**
 * Derived from ship_object.tab
 *
 * See {@link ShipObject} for descriptions of each field.
 */
interface ShipObjectRecord {
  OBJECT_ID: number;
  SLIDE_DAMPENER: number | null;
  CURRENT_CHASSIS_HIT_POINTS: number | null;
  MAXIMUM_CHASSIS_HIT_POINTS: number | null;
  CHASSIS_TYPE: number | null;
  CMP_ARMOR_HP_MAXIMUM: string | null;
  CMP_ARMOR_HP_CURRENT: string | null;
  CMP_EFFICIENCY_GENERAL: string | null;
  CMP_EFFICIENCY_ENG: string | null;
  CMP_ENG_MAINTENANCE: string | null;
  CMP_MASS: string | null;
  CMP_CRC: string | null;
  CMP_HP_CURRENT: string | null;
  CMP_HP_MAXIMUM: string | null;
  CMP_FLAGS: string | null;
  CMP_NAMES: string | null;
  WEAPON_DAMAGE_MAXIMUM: string | null;
  WEAPON_DAMAGE_MINIMUM: string | null;
  WEAPON_EFFECTIVENESS_SHIELDS: string | null;
  WEAPON_EFFECTIVENESS_ARMOR: string | null;
  WEAPON_ENG_PER_SHOT: string | null;
  WEAPON_REFIRE_RATE: string | null;
  WEAPON_AMMO_CURRENT: string | null;
  WEAPON_AMMO_MAXIMUM: string | null;
  WEAPON_AMMO_TYPE: string | null;
  SHIELD_HP_FRONT_MAXIMUM: number | null;
  SHIELD_HP_BACK_MAXIMUM: number | null;
  SHIELD_RECHARGE_RATE: number | null;
  CAPACITOR_ENG_MAXIMUM: number | null;
  CAPACITOR_ENG_RECHARGE_RATE: number | null;
  ENGINE_ACC_RATE: number | null;
  ENGINE_DECELERATION_RATE: number | null;
  ENGINE_PITCH_ACC_RATE: number | null;
  ENGINE_YAW_ACC_RATE: number | null;
  ENGINE_ROLL_ACC_RATE: number | null;
  ENGINE_PITCH_RATE_MAXIMUM: number | null;
  ENGINE_YAW_RATE_MAXIMUM: number | null;
  ENGINE_ROLL_RATE_MAXIMUM: number | null;
  ENGINE_SPEED_MAXIMUM: number | null;
  REACTOR_ENG_GENERATION_RATE: number | null;
  BOOSTER_ENG_MAXIMUM: number | null;
  BOOSTER_ENG_RECHARGE_RATE: number | null;
  BOOSTER_ENG_CONSUMPTION_RATE: number | null;
  BOOSTER_ACC: number | null;
  BOOSTER_SPEED_MAXIMUM: number | null;
  DROID_IF_CMD_SPEED: number | null;
  INSTALLED_DCD: number | null;
  CHASSIS_CMP_MASS_MAXIMUM: number | null;
  CMP_CREATORS: string | null;
  CARGO_HOLD_CONTENTS_MAXIMUM: number | null;
  CARGO_HOLD_CONTENTS_CURRENT: number | null;
  CARGO_HOLD_CONTENTS: string | null;
}

@Service()
export class ShipObjectService {
  private dataloader = new DataLoader(ShipObjectService.batchFunction, { maxBatchSize: 999, cache: false });
  load = this.dataloader.load.bind(this.dataloader);

  static async batchFunction(keys: readonly string[]) {
    const results = await knexDb.select().from<ShipObjectRecord>('SHIP_OBJECTS').whereIn('OBJECT_ID', keys);

    return keys.map(key => results.find(result => String(result.OBJECT_ID) === key));
  }
}
