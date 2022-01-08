import { Service } from 'typedi';
import got from 'got';

import { STATION_ID_TO_ACCOUNT_NAME_SERVICE_URL } from '../config';

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

const StationIdAccountNameMap = new Map<number, Promise<string | null>>();

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

  getAccountNameFromStationId(stationId: number) {
    if (!STATION_ID_TO_ACCOUNT_NAME_SERVICE_URL) {
      return null;
    }

    if (!StationIdAccountNameMap.has(stationId)) {
      const endpoint = STATION_ID_TO_ACCOUNT_NAME_SERVICE_URL.replace('{STATION_ID}', stationId.toString());

      const newPromise = got(endpoint).then(res => (res.body === 'NULL' ? null : res.body));

      StationIdAccountNameMap.set(stationId, newPromise);

      return newPromise;
    }

    return StationIdAccountNameMap.get(stationId) ?? null;
  }
}
