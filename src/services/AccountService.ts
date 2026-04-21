import DataLoader from 'dataloader';
import { Service } from 'typedi';

import { GET_ALL_ACCOUNT_NAMES_SERVICE_URL, STATION_ID_TO_ACCOUNT_NAME_SERVICE_URL } from '../config';

import db, { loginDb } from './db';

/**
 * Derived from the PLAYERS table.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface PlayerRecord {
  CHARACTER_OBJECT: string;
  STATION_ID: number | null;
  CREATE_TIME: Date | null;
  LAST_LOGIN_TIME: Date | null;
}

interface SwgCharactersRecord {
  STATION_ID: number;
  CLUSTER_ID: number;
  CHARACTER_NAME: string;
  OBJECT_ID: number | null;
  CHARACTER_TYPE: number | null;
  TEMPLATE_ID: number | null;
  ENABLED: string;
}

interface ClusterListRecord {
  ID: number;
  NAME: string | null;
  NUM_CHARACTERS: number | null;
  ADDRESS: string | null;
  PORT: number | null;
  SECRET: string | null;
  LOCKED: string | null;
  NOT_RECOMMENDED: string | null;
  GROUP_ID: number;
  ONLINE_PLAYER_LIMIT: number | null;
  ONLINE_FREE_TRIAL_LIMIT: number | null;
  FREE_TRIAL_CAN_CREATE_CHAR: string | null;
  ONLINE_TUTORIAL_LIMIT: number | null;
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

@Service()
export class AccountService {
  private db = db;
  private loginDb = loginDb;

  async getAllCharactersForAccount(stationId: number) {
    const characters = await this.loginDb
      .select('OBJECT_ID')
      .from<SwgCharactersRecord>('SWG_CHARACTERS')
      .innerJoin<ClusterListRecord>('CLUSTER_LIST', 'SWG_CHARACTERS.CLUSTER_ID', 'CLUSTER_LIST.ID')
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

  private accountNameLoader = new DataLoader(
    async (stationIds: readonly number[]) => {
      if (!STATION_ID_TO_ACCOUNT_NAME_SERVICE_URL) {
        return stationIds.map(() => null);
      }

      try {
        const endpoint = STATION_ID_TO_ACCOUNT_NAME_SERVICE_URL.replace('{STATION_ID}', stationIds.join(','));
        const res = await fetch(endpoint);
        const body = await res.text();

        if (stationIds.length === 1) {
          // Single ID — response is plain text (existing PHP behavior)
          return [body === 'NULL' ? null : body];
        }

        // Multiple IDs — response is JSON: { "stationId": "username" | null }
        const results: Record<string, string | null> = JSON.parse(body);
        return stationIds.map(id => results[id.toString()] ?? null);
      } catch (err) {
        // Don't let a transient lookup failure poison the cache forever.
        for (const id of stationIds) {
          this.accountNameLoader.clear(id);
        }
        throw err;
      }
    },
    { cache: true }
  );

  async primeAllAccountNames() {
    if (!GET_ALL_ACCOUNT_NAMES_SERVICE_URL) {
      return;
    }

    const res = await fetch(GET_ALL_ACCOUNT_NAMES_SERVICE_URL);
    const results = (await res.json()) as Record<string, string | null>;

    for (const [stationId, username] of Object.entries(results)) {
      this.accountNameLoader.prime(Number(stationId), username);
    }
  }

  getAccountNameFromStationId(stationId: number) {
    if (!STATION_ID_TO_ACCOUNT_NAME_SERVICE_URL) {
      return null;
    }

    return this.accountNameLoader.load(stationId);
  }
}
