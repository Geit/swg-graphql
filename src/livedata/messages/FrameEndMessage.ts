import { SmartBuffer } from 'smart-buffer';

import { ISwgNetworkMessageBase } from './ISwgNetworkMessage';

export interface FrameEndData {
  serverId: number;
  frameTime: number;
  profilerDataLen: number;
  profilerData: string;
}

export class FrameEndMessage implements ISwgNetworkMessageBase {
  public type = 'FrameEndMessage' as const;

  public crc: number;
  public operandCount: number;

  public data: FrameEndData;

  static fromBuffer(operandCount: number, crc: number, buf: SmartBuffer) {
    const fme = new FrameEndMessage();

    fme.crc = crc;
    fme.operandCount = operandCount;

    const serverId = buf.readUInt32LE();
    const frameTime = buf.readUInt32LE();
    const profilerDataLen = buf.readUInt16LE();
    const profilerData = buf.readString(profilerDataLen);

    fme.data = {
      serverId,
      frameTime,
      profilerDataLen,
      profilerData,
    };

    return fme;
  }
}
