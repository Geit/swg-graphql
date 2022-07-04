import { Service } from 'typedi';

import db from './db';

/**
 * Derived from the PLAYERS table.
 */
export interface PlayerRecord {
  CHARACTER_OBJECT: number;
  STATION_ID: number | null;
  CREATE_TIME: Date | null;
  LAST_LOGIN_TIME: Date | null;
}

@Service()
export class PlayerCreatureObjectService {
  private db = db;

  async getPlayerRecordForCharacter(id: string) {
    const player = await this.db
      .first('STATION_ID', 'CREATE_TIME', 'LAST_LOGIN_TIME')
      .from<PlayerRecord>('PLAYERS')
      .where('CHARACTER_OBJECT', id);

    return player;
  }

  getRecentlyLoggedInCharacters(withinLastSeconds: number) {
    const query = this.db
      .from<PlayerRecord>('PLAYERS')
      .select()
      .whereRaw('LAST_LOGIN_TIME >= SYSDATE - ? * (1/24/60/60)', withinLastSeconds);

    console.log(query.toQuery());

    return query;
  }
}
