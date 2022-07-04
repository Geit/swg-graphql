import DataLoader from 'dataloader';
import { Service } from 'typedi';

import { loadDatatable } from '../utils/DataTableReader';

@Service({
  global: true,
})
export class DataTableService {
  private dataloader = new DataLoader(DataTableService.batchFunction, { maxBatchSize: 999, cache: true });
  load = this.dataloader.load.bind(this.dataloader);

  static batchFunction(fileNames: readonly string[]) {
    return Promise.all(fileNames.map(fileName => loadDatatable(fileName)));
  }
}
