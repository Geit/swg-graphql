import DataLoader from 'dataloader';
import { Service } from 'typedi';

import knexDb from './db';

/**
 * Derived from player_objects.tab
 *
 * See {@link PlayerObject} for descriptions of each field.
 */
export interface PlayerObjectRecord {
  OBJECT_ID: number;
  STATION_ID: number;
  PERSONAL_PROFILE_ID: string;
  CHARACTER_PROFILE_ID: string;
  SKILL_TITLE: string;
  BORN_DATE: number;
  PLAYED_TIME: number;
  FORCE_REGEN_RATE: number;
  FORCE_POWER: number;
  MAX_FORCE_POWER: number;
  NUM_LOTS: number;
  ACTIVE_QUESTS: string;
  COMPLETED_QUESTS: string;
  CURRENT_QUEST: number;
  QUESTS: string;
  ROLE_ICON_CHOICE: number;
  QUESTS2: string;
  QUESTS3: string;
  QUESTS4: string;
  SKILL_TEMPLATE: string;
  WORKING_SKILL: string;
  CURRENT_GCW_POINTS: number;
  CURRENT_GCW_RATING: number;
  CURRENT_PVP_KILLS: number;
  LIFETIME_GCW_POINTS: number;
  MAX_GCW_IMPERIAL_RATING: number;
  MAX_GCW_REBEL_RATING: number;
  LIFETIME_PVP_KILLS: number;
  NEXT_GCW_RATING_CALC_TIME: number;
  COLLECTIONS: string;
  SHOW_BACKPACK: string;
  SHOW_HELMET: string;
  COLLECTIONS2: string;
  QUESTS5: string;
  QUESTS6: string;
  QUESTS7: string;
  QUESTS8: string;
  QUESTS9: string;
}

@Service()
export class PlayerObjectService {
  private dataloader = new DataLoader(PlayerObjectService.batchFunction);
  load = this.dataloader.load.bind(this.dataloader);

  static async batchFunction(keys: readonly string[]) {
    const results = await knexDb.select().from<PlayerObjectRecord>('PLAYER_OBJECTS').whereIn('OBJECT_ID', keys);

    return keys.map(key => results.find(result => String(result.OBJECT_ID) === key));
  }
}
