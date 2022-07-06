import { SmartBuffer } from 'smart-buffer';

import { ISwgNetworkMessageBase } from './ISwgNetworkMessage';

export interface PlanetNodeStatusData {
  locationX: number;
  locationZ: number;
  isLoaded: number;
  serverCount: number;
  serverIds: number[];
  subscriptionCount: number;
  subscriptions: number[];
}

interface PlanetNodeStatusMessageData {
  count: number;
  nodeStatus: PlanetNodeStatusData[];
}

export class PlanetNodeStatusMessage implements ISwgNetworkMessageBase {
  public type = 'PlanetNodeStatusMessage' as const;

  public crc: number;
  public operandCount: number;

  public data: PlanetNodeStatusMessageData;

  static fromBuffer(operandCount: number, crc: number, buf: SmartBuffer) {
    const pnsm = new PlanetNodeStatusMessage();

    pnsm.crc = crc;
    pnsm.operandCount = operandCount;

    const nodeStatusCount = buf.readUInt32LE();

    const nodeStatus: PlanetNodeStatusData[] = [];

    for (let i = 0; i < nodeStatusCount; i++) {
      const locationX = buf.readInt32LE();
      const locationZ = buf.readInt32LE();
      const isLoaded = buf.readInt8();

      const serverCount = buf.readUInt32LE();
      const serverIds: number[] = [];
      for (let j = 0; j < serverCount; j++) serverIds.push(buf.readUInt32LE());

      const subscriptionCount = buf.readUInt32LE();
      const subscriptions: number[] = [];
      for (let j = 0; j < subscriptionCount; j++) subscriptions.push(buf.readUInt32LE());

      nodeStatus.push({
        locationX,
        locationZ,
        isLoaded,
        serverCount,
        serverIds,
        subscriptionCount,
        subscriptions,
      });
    }

    pnsm.data = {
      count: nodeStatusCount,
      nodeStatus,
    };

    return pnsm;
  }
}
