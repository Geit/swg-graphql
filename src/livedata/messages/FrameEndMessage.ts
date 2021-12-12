import { Parser } from 'binary-parser';

import { ISwgNetworkMessageBase } from './ISwgNetworkMessage';

export interface FrameEndData {
  serverId: number;
  frameTime: number;
  profilerDataLen: number;
  profilerData: string;
}

export interface FrameEndMessage extends ISwgNetworkMessageBase {
  type: 'FrameEndMessage';
  data: FrameEndData;
}

export const FrameEndMessageParser = new Parser()
  .endianess('little')
  .uint32('serverId')
  .uint32('frameTime')
  .uint16('profilerDataLen')
  .string('profilerData', { length: 'dataLen' });

// Compile the parsers at require time...
FrameEndMessageParser.compile();
