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
export class AccountService {
  private db = db;

  async getAllCharactersForAccount(stationId: number) {
    const characters = await this.db
      .select('CHARACTER_OBJECT')
      .from<PlayerRecord>('PLAYERS')
      .where('STATION_ID', stationId);

    return characters;
  }
}
