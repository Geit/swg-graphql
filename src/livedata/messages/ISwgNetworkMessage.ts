import { Parser } from 'binary-parser';

interface NoopRawData {
  rawData: string;
}

/**
 * For unrecognised packets, we still want to capture the raw data for future implementation
 * effort/debugging reasons.
 */
export const NoopParser = new Parser().endianess('little').string('rawData', {
  greedy: true,
  encoding: 'hex',
});

export interface ISwgNetworkMessageBase {
  type: string;
  operandCount: number;
  crc: number;
  data: unknown;
}

export interface SwgNetworkMessageUnknown extends ISwgNetworkMessageBase {
  type: 'UNKNOWN';
  data: NoopRawData;
}
