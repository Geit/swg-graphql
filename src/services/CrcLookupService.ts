import { Service } from 'typedi';

import { loadCrcLookupTable } from '../utils/CrcTableReader';

@Service({ global: true })
export class CrcLookupService {
  crcTable = loadCrcLookupTable('misc/object_template_crc_string_table.iff');

  async lookupCrc(crc: number) {
    const table = await this.crcTable;

    return table.get(crc);
  }
}
