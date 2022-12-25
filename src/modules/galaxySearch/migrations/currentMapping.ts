import type { MappingProperty } from '@elastic/elasticsearch/lib/api/types';

export const currentMappingProperties: Record<string, MappingProperty> = {
  type: { type: 'keyword' },
  id: { type: 'keyword' },
  lastSeen: { type: 'date' },
  ownerId: { type: 'keyword' },

  objectName: { type: 'text' },
  basicName: { type: 'text' },
  stationId: { type: 'keyword' },
  accountName: { type: 'text' },
  'location.scene': { type: 'keyword' },
  'location.x': { type: 'short' },
  'location.y': { type: 'short' },
  'location.z': { type: 'short' },
  ownerAccountName: { type: 'text' },
  ownerStationId: { type: 'keyword' },
  template: { type: 'text' },
  templateId: { type: 'keyword' },

  relevancyBump: { type: 'rank_feature' },
  resourceName: { type: 'text' },
  resourceClass: { type: 'keyword' },
  resourceClassId: { type: 'keyword' },
  resourcePlanets: { type: 'keyword' },
  resourceDepletedTime: { type: 'date' },
  'resourceAttributes.res_cold_resist': { type: 'short' },
  'resourceAttributes.res_conductivity': { type: 'short' },
  'resourceAttributes.res_decay_resist': { type: 'short' },
  'resourceAttributes.entangle_resistance': { type: 'short' },
  'resourceAttributes.res_flavor': { type: 'short' },
  'resourceAttributes.res_heat_resist': { type: 'short' },
  'resourceAttributes.res_malleability': { type: 'short' },
  'resourceAttributes.res_quality': { type: 'short' },
  'resourceAttributes.res_potential_energy': { type: 'short' },
  'resourceAttributes.res_shock_resistance': { type: 'short' },
  'resourceAttributes.res_toughness': { type: 'short' },

  // Account fields
  characters: { type: 'text' },
  characterIds: { type: 'keyword' },
} as const;
