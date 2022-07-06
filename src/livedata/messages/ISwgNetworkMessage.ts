export interface ISwgNetworkMessageBase {
  readonly type: string;
  operandCount: number;
  crc: number;
  data: unknown;
}
