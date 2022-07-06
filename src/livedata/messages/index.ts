import { SmartBuffer } from 'smart-buffer';

import getStringCrc from '../../utils/crc';

import { FrameEndMessage } from './FrameEndMessage';
import { GameServerStatusMessage } from './GameServerStatus';
import { PlanetNodeStatusMessage } from './PlanetNodeStatusMessage';
import { PlanetObjectStatusMessage } from './PlanetObjectStatusMessage';

const registeredMessageTypes = {
  [getStringCrc('FrameEndMessage')]: FrameEndMessage,
  [getStringCrc('GameServerStatus')]: GameServerStatusMessage,
  [getStringCrc('PlanetNodeStatusMessage')]: PlanetNodeStatusMessage,
  [getStringCrc('PlanetObjectStatusMessage')]: PlanetObjectStatusMessage,
};

export type SBMessageTypes =
  | FrameEndMessage
  | GameServerStatusMessage
  | PlanetNodeStatusMessage
  | PlanetObjectStatusMessage;

export const parse = (data: Buffer): SBMessageTypes | null => {
  const sb = SmartBuffer.fromBuffer(data);

  const operandCount = sb.readUInt16LE();
  const crc = sb.readInt32LE();

  const handlerClass = registeredMessageTypes[crc];

  if (!handlerClass) {
    // console.log(`No handler for ${crc} with ${operandCount} operands,`);
    // console.log('Registered handlers', registeredMessageTypes);
    return null;
  }

  const internalData = handlerClass.fromBuffer(operandCount, crc, sb);

  return internalData;
};
