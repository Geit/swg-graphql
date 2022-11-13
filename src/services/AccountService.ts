import { Service } from 'typedi';
import got from 'got';

import { STATION_ID_TO_ACCOUNT_NAME_SERVICE_URL } from '../config';

import db, { loginDb } from './db';

/**
 * Derived from the PLAYERS table.
 */
interface PlayerRecord {
  CHARACTER_OBJECT: string;
  STATION_ID: number | null;
  CREATE_TIME: Date | null;
  LAST_LOGIN_TIME: Date | null;
}

interface AccountRewardEventRecord {
  STATION_ID: number;
  EVENT_ID: string;
  DATE_CONSUMED: Date;
  CLUSTER_ID: number;
  CHARACTER_ID: number;
}

interface AccountRewardItemRecord {
  STATION_ID: number;
  ITEM_ID: string;
  DATE_CLAIMED: Date;
  CLUSTER_ID: number;
  CHARACTER_ID: number;
}

const StationIdAccountNameMap = new Map<number, Promise<string | null>>();

@Service()
export class AccountService {
  private db = db;
  private loginDb = loginDb;

  async getAllCharactersForAccount(stationId: number) {
    const characters = await this.db
      .select('CHARACTER_OBJECT')
      .from<PlayerRecord>('PLAYERS')
      .where('STATION_ID', stationId);

    return characters;
  }

  async getAllOneTimeEvents(stationId: number) {
    const events = await this.loginDb
      .select()
      .from<AccountRewardEventRecord>('ACCOUNT_REWARD_EVENTS')
      .where('STATION_ID', stationId);

    return events.map(e => ({
      type: 'event' as const,
      stationId: e.STATION_ID,
      eventId: e.EVENT_ID,
      dateConsumed: e.DATE_CONSUMED,
      clusterId: e.CLUSTER_ID,
      characterId: e.CHARACTER_ID,
    }));
  }

  async getAllOneTimeItems(stationId: number) {
    const events = await this.loginDb
      .select()
      .from<AccountRewardItemRecord>('ACCOUNT_REWARD_ITEMS')
      .where('STATION_ID', stationId);

    return events.map(e => ({
      type: 'item' as const,
      stationId: e.STATION_ID,
      itemId: e.ITEM_ID,
      dateConsumed: e.DATE_CLAIMED,
      clusterId: e.CLUSTER_ID,
      characterId: e.CHARACTER_ID,
    }));
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
