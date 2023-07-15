type StatName = string;

export interface ShipPartStatLookup {
  name: StatName;
  meanKey: string;
  stdDevKey: string;
  inverse?: boolean;
  objVarKey: string;
}

export type ShipPartType =
  | 'armor'
  | 'engine'
  | 'weapon'
  | 'shield'
  | 'reactor'
  | 'capacitor'
  | 'booster'
  | 'cargo_hold'
  | 'droid_interface';

export interface ShipPartStat {
  name: StatName;
  mean: number;
  stdDev: number;
  inverse?: boolean;
  objVarKey: string;
}

type RELevel = number;

export interface ShipPart {
  crc: number;
  type: ShipPartType;
  name: string;
  reLevel: number;
  stats: ShipPartStat[];
}

export type StatBestInClassForReLevel = Map<RELevel, ShipPartStat>;
export type StatBestInClassMap = Map<StatName, StatBestInClassForReLevel>;
