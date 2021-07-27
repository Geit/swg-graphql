import { Parser } from 'binary-parser';

import getStringCrc from '../../utils/crc';

import { FrameEndMessageParser, FrameEndMessage } from './FrameEndMessage';
import { GameServerStatusMessage, GameServerStatusParser } from './GameServerStatus';
import { NoopParser, SwgNetworkMessageUnknown } from './ISwgNetworkMessage';
import { PlanetNodeStatusMessage, PlanetNodeStatusMessageParser } from './PlanetNodeStatusMessage';
import { PlanetObjectStatusMessage, PlanetObjectStatusMessageParser } from './PlanetObjectStatusMessage';

export const MessageNameFromCrc: Record<number, string> = {
  [getStringCrc('FrameEndMessage')]: 'FrameEndMessage',
  [getStringCrc('PlanetObjectStatusMessage')]: 'PlanetObjectStatusMessage',
  [getStringCrc('PlanetNodeStatusMessage')]: 'PlanetNodeStatusMessage',
  [getStringCrc('GameServerStatus')]: 'GameServerStatus',
};

export type SwgNetworkMessageType =
  | SwgNetworkMessageUnknown
  | FrameEndMessage
  | GameServerStatusMessage
  | PlanetObjectStatusMessage
  | PlanetNodeStatusMessage;

export const SwgNetworkMessage = new Parser()
  .endianess('little')
  .uint16('operandCount')
  .int32('crc')
  .choice('data', {
    tag: 'crc',
    choices: {
      [getStringCrc('FrameEndMessage')]: FrameEndMessageParser,
      [getStringCrc('PlanetObjectStatusMessage')]: PlanetObjectStatusMessageParser,
      [getStringCrc('PlanetNodeStatusMessage')]: PlanetNodeStatusMessageParser,
      [getStringCrc('GameServerStatus')]: GameServerStatusParser,
    },
    defaultChoice: NoopParser,
  });

SwgNetworkMessage.compile();

export default SwgNetworkMessage;
