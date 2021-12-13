import DataLoader from 'dataloader';
import { Service } from 'typedi';

import knexDb from './db';

/**
 * Derived from tangible_objects.tab
 *
 * See {@link ITangibleObject} for descriptions of each field.
 */
export interface TangibleObjectRecord {
  OBJECT_ID: string;
  MAX_HIT_POINTS: number;
  OWNER_ID: string;
  VISIBLE: string;
  APPEARANCE_DATA: string;
  INTEREST_RADIUS: number;
  PVP_TYPE: number;
  PVP_FACTION: number;
  DAMAGE_TAKEN: number;
  CUSTOM_APPEARANCE: string;
  COUNT: number;
  CONDITION: number;
  CREATOR_ID: string;
  SOURCE_DRAFT_SCHEMATIC: string;
}

@Service()
export class TangibleObjectService {
  private dataloader = new DataLoader(TangibleObjectService.batchFunction);
  load = this.dataloader.load.bind(this.dataloader);

  static async batchFunction(keys: readonly string[]) {
    const results = await knexDb.select().from<TangibleObjectRecord>('TANGIBLE_OBJECTS').whereIn('OBJECT_ID', keys);

    return keys.map(key => results.find(result => result.OBJECT_ID === key));
  }
}
