interface BaseDocument {
  type: unknown;
  id: string;
  lastSeen: string;

  relevancyBump?: number;
}

export interface ObjectDocument extends BaseDocument {
  type: 'Object';
  ownerId?: string;

  objectName?: string;
  basicName: string;

  // Only for Character Objects
  accountName?: string;
  stationId?: string;
}

type ResourceAttribute =
  | 'res_cold_resist'
  | 'res_conductivity'
  | 'res_decay_resist'
  | 'entangle_resistance'
  | 'res_flavor'
  | 'res_heat_resist'
  | 'res_malleability'
  | 'res_quality'
  | 'res_potential_energy'
  | 'res_shock_resistance'
  | 'res_toughness';

export interface ResourceTypeDocument extends BaseDocument {
  type: 'ResourceType';
  resourceName: string;
  resourceClass: string;
  resourceClassId: string;
  resourcePlanets: string[];
  resourceDepletedTime: Date;
  resourceAttributes: {
    [key in ResourceAttribute]?: number;
  };
}

export interface AccountDocument extends BaseDocument {
  type: 'Account';
  accountName?: string;
  stationId: string;
}

export type SearchDocument = AccountDocument | ObjectDocument | ResourceTypeDocument;
