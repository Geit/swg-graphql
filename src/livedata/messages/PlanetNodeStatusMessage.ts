import { Parser } from 'binary-parser';

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

export interface PlanetNodeStatusMessage extends ISwgNetworkMessageBase {
  type: 'PlanetNodeStatusMessage';
  data: PlanetNodeStatusMessageData;
}

const PlanetNodeStatusParser = new Parser()
  .endianess('little')
  .int32('locationX')
  .int32('locationZ')
  .int8('isLoaded')
  .uint32('serverCount')
  .array('serverIds', {
    length: 'serverCount',
    type: 'uint32le',
  })
  .uint32('subscriptionCounts')
  .array('subscriptions', {
    length: 'subscriptionCounts',
    type: 'uint32le',
  });

export const PlanetNodeStatusMessageParser = new Parser().endianess('little').uint32('count').array('nodeStatus', {
  length: 'count',
  type: PlanetNodeStatusParser,
});

// Compile the parsers at require time...
PlanetNodeStatusParser.compile();
PlanetNodeStatusMessageParser.compile();
