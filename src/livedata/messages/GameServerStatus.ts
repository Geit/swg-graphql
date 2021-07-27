import { Parser } from 'binary-parser';

import { ISwgNetworkMessageBase } from './ISwgNetworkMessage';

export interface GameServerStatusData {
  isOnline: number;
  ipAddressLen: number;
  ipAddress: string;
  serverId: number;
  systemPid: number;
  sceneIdLen: number;
  sceneId: string;
}

export interface GameServerStatusMessage extends ISwgNetworkMessageBase {
  type: 'GameServerStatus';
  data: GameServerStatusData;
}

export const GameServerStatusParser = new Parser()
  .endianess('little')
  .int8('isOnline')
  .uint16('ipAddressLen')
  .string('ipAddress', { length: 'ipAddressLen' })
  .uint32('serverId')
  .uint32('systemPid')
  .uint16('sceneIdLen')
  .string('sceneId', { length: 'sceneIdLen' });

// Compile the parsers at require time...
GameServerStatusParser.compile();
