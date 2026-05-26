import DataLoader from 'dataloader';
import { Service } from 'typedi';

import knexDb from './db';

/**
 * Derived from the BIOGRAPHIES table.
 *
 * Player-written biography text for a character. One row per character.
 */
export interface BiographyRecord {
  OBJECT_ID: number;
  BIOGRAPHY: string | null;
}

@Service()
export class BiographyService {
  private dataloader = new DataLoader(BiographyService.batchFunction, { maxBatchSize: 999, cache: false });
  load = this.dataloader.load.bind(this.dataloader);

  static async batchFunction(keys: readonly string[]) {
    const results = await knexDb.select().from<BiographyRecord>('BIOGRAPHIES').whereIn('OBJECT_ID', keys);

    const byId = new Map(results.map(result => [String(result.OBJECT_ID), result]));
    return keys.map(key => byId.get(key));
  }
}
