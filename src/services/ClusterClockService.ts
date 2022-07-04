import DataLoader from 'dataloader';
import { Service } from 'typedi';

import knexDb from './db';

/**
 * Derived from planet_objects.tab
 *
 * See {@link PlanetObject} for descriptions of each field.
 */
interface ClockRecord {
  LAST_SAVE_TIME: number;
  LAST_SAVE_TIMESTAMP: Date;
}

@Service()
export class ClusterClockService {
  async getRealTime(clusterRelativeTime: number) {
    if (clusterRelativeTime < 0) return new Date(2524608000 * 1000);

    const time = await this.load('');

    if (!time) return null;

    const secondsAwayFromLastSave = clusterRelativeTime - time.LAST_SAVE_TIME;
    const lastSaveUnixSecs = time.LAST_SAVE_TIMESTAMP.getTime() / 1000;

    const targetDate = new Date((lastSaveUnixSecs + secondsAwayFromLastSave) * 1000);

    return targetDate;
  }

  private dataloader = new DataLoader(ClusterClockService.batchFunction, { cache: false });
  load = this.dataloader.load.bind(this.dataloader);

  static async batchFunction(keys: readonly string[]) {
    const time = await knexDb.first().from<ClockRecord>('CLOCK');

    return keys.map(() => time);
  }
}
