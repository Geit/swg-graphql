import DataLoader from 'dataloader';
import { Service } from 'typedi';

import { loadDatatable, LoadDatatableOptions } from '../utils/DataTableReader';

/**
 * Stable cache key so repeated loads of the same datatable dedupe across the whole process. Call
 * sites pass fresh option literals, and DataLoader keys by reference by default — without this every
 * call re-reads and re-parses the `.iff`. camelcase is part of the key because it changes the rows.
 */
const cacheKeyFn = (options: LoadDatatableOptions) => `${options.fileName}|${options.camelcase ?? false}`;

@Service({
  global: true,
})
export class DataTableService {
  private dataloader = new DataLoader(DataTableService.batchFunction, {
    maxBatchSize: 999,
    cache: true,
    cacheKeyFn,
  });

  public async load<T>(options: LoadDatatableOptions): Promise<T[]> {
    try {
      return (await this.dataloader.load(options)) as T[];
    } catch (err) {
      // Don't keep a failed load cached — a datatable that's missing now may be bundled later, so a
      // subsequent call should retry rather than replay the cached rejection.
      this.dataloader.clear(options);
      throw err;
    }
  }

  static batchFunction(loadRequests: readonly LoadDatatableOptions[]) {
    const loadingPromises = loadRequests.map(loadRequest => loadDatatable(loadRequest));

    return Promise.all(loadingPromises);
  }
}
