import { Service } from 'typedi';

import db from './db';

/**
 * Derived from the PLAYERS table.
 */
interface PlayerRecord {
  CHARACTER_OBJECT: string;
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
}
