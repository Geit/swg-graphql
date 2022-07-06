import { SmartBuffer } from 'smart-buffer';

import { ISwgNetworkMessageBase } from './ISwgNetworkMessage';

export interface PlanetObjectStatus {
  networkId: bigint;
  locationX: number;
  locationZ: number;
  authoritativeServer: number;
  interestRadius: number;
  deleteObject: number;
  objectTypeTag: number;
  level: number;
  hibernating: number;
  templateCrc: number;
  aiActivity: number;
  creationType: number;
}

interface PlanetObjectStatusMessageData {
  count: number;
  objectStatuses: PlanetObjectStatus[];
}

export class PlanetObjectStatusMessage implements ISwgNetworkMessageBase {
  public type = 'PlanetObjectStatusMessage' as const;

  public crc: number;
  public operandCount: number;

  public data: PlanetObjectStatusMessageData;

  static fromBuffer(operandCount: number, crc: number, buf: SmartBuffer) {
    const posm = new PlanetObjectStatusMessage();

    posm.crc = crc;
    posm.operandCount = operandCount;

    const objectStatusCount = buf.readUInt32LE();

    const objectStatuses: PlanetObjectStatus[] = [];

    for (let i = 0; i < objectStatusCount; i++) {
      const networkId = buf.readBigInt64LE();
      const locationX = buf.readInt32LE();
      const locationZ = buf.readInt32LE();
      const authoritativeServer = buf.readUInt32LE();
      const interestRadius = buf.readInt32LE();
      const deleteObject = buf.readInt32LE();
      const objectTypeTag = buf.readInt32LE();
      const level = buf.readInt32LE();
      const hibernating = buf.readInt8();
      const templateCrc = buf.readInt32LE();
      const aiActivity = buf.readInt32LE();
      const creationType = buf.readInt32LE();

      objectStatuses.push({
        networkId,
        locationX,
        locationZ,
        authoritativeServer,
        interestRadius,
        deleteObject,
        objectTypeTag,
        level,
        hibernating,
        templateCrc,
        aiActivity,
        creationType,
      });
    }

    posm.data = {
      count: objectStatusCount,
      objectStatuses,
    };

    return posm;
  }
}
