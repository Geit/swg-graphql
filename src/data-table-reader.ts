import { loadCrcLookupTable } from './utils/CrcTableReader';

async function main() {
  console.log(process.memoryUsage());
  console.time();
  const data = await loadCrcLookupTable('object_template_crc_string_table.iff');
  console.timeEnd();
  console.log(process.memoryUsage());
  // console.log(data);
}

main();
