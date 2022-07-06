import { SmartBuffer } from 'smart-buffer';

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

export class GameServerStatusMessage implements ISwgNetworkMessageBase {
  public type = 'GameServerStatus' as const;

  public crc: number;
  public operandCount: number;

  public data: GameServerStatusData;

  static fromBuffer(operandCount: number, crc: number, buf: SmartBuffer) {
    const gssm = new GameServerStatusMessage();

    gssm.crc = crc;
    gssm.operandCount = operandCount;

    const isOnline = buf.readInt8();
    const ipAddressLen = buf.readUInt16LE();
    const ipAddress = buf.readString(ipAddressLen);
    const serverId = buf.readUInt32LE();
    const systemPid = buf.readUInt32LE();
    const sceneIdLen = buf.readUInt16LE();
    const sceneId = buf.readString(sceneIdLen);

    gssm.data = {
      isOnline,
      ipAddressLen,
      ipAddress,
      serverId,
      systemPid,
      sceneIdLen,
      sceneId,
    };

    return gssm;
  }
}
