import DataLoader from 'dataloader';
import { Service } from 'typedi';

import { loadDatatable, LoadDatatableOptions } from '../utils/DataTableReader';

@Service({
  global: true,
})
export class DataTableService {
  private dataloader = new DataLoader(DataTableService.batchFunction, { maxBatchSize: 999, cache: true });
  private _load = this.dataloader.load.bind(this.dataloader);

  public async load<T>(options: LoadDatatableOptions): Promise<T[]> {
    const data = (await this._load(options)) as T[];

    return data;
  }

  static batchFunction(loadRequests: readonly LoadDatatableOptions[]) {
    const loadingPromises = loadRequests.map(loadRequest => loadDatatable(loadRequest));

    return Promise.all(loadingPromises);
  }
}
