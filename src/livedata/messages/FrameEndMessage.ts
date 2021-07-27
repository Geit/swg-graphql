import { Parser } from 'binary-parser';

import { ISwgNetworkMessageBase } from './ISwgNetworkMessage';

interface FrameEndData {
  pid: number;
  /**
   * Hello.
   */
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
  .uint32('pid')
  .uint32('frameTime')
  .uint16('profilerDataLen')
  .string('profilerData', { length: 'dataLen' });

// Compile the parsers at require time...
FrameEndMessageParser.compile();
