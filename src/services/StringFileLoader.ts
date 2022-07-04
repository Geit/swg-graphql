import DataLoader from 'dataloader';
import { Service } from 'typedi';

import { loadStringFile } from '../utils/StringFileReader';

@Service({
  global: true,
})
export class StringFileLoader {
  private dataloader = new DataLoader(StringFileLoader.batchFunction, { maxBatchSize: 999, cache: true });
  load = this.dataloader.load.bind(this.dataloader);

  static batchFunction(fileNames: readonly string[]) {
    return Promise.all(fileNames.map(fileName => loadStringFile(fileName)));
  }
}
