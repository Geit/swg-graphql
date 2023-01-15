import getStringCrc from './crc';

const IMPERIAL_CRC = getStringCrc('imperial');
const REBEL_CRC = getStringCrc('rebel');

export const getFactionNameFromCrc = (crc: number | null) => {
  if (crc === IMPERIAL_CRC) return 'Imperial';
  else if (crc === REBEL_CRC) return 'Rebel';

  return null;
};
