import { Parser } from 'binary-parser';

import { ISwgNetworkMessageBase } from './ISwgNetworkMessage';

export interface PlanetObjectStatus {
  networkId: BigInt;
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

export interface PlanetObjectStatusMessage extends ISwgNetworkMessageBase {
  type: 'PlanetObjectStatusMessage';
  data: PlanetObjectStatusMessageData;
}

const PlanetObjectStatusParser = new Parser()
  .endianess('little')
  .int64('networkId')
  .int32('locationX')
  .int32('locationZ')
  .uint32('authoritativeServer')
  .int32('interestRadius')
  .int32('deleteObject')
  .int32('objectTypeTag')
  .int32('level')
  .int8('hibernating')
  .int32('templateCrc')
  .int32('aiActivity')
  .int32('creationType');

export const PlanetObjectStatusMessageParser = new Parser()
  .endianess('little')
  .uint32('count')
  .array('objectStatuses', {
    length: 'count',
    type: PlanetObjectStatusParser,
  });

// Compile the parsers at require time...
PlanetObjectStatusParser.compile();
PlanetObjectStatusMessageParser.compile();
