import { MappingProperty } from '@elastic/elasticsearch/lib/api/types';

import { ELASTIC_SEARCH_INDEX_NAME, ENABLE_TEXT_SEARCH, SEARCH_INDEXER_INTERVAL } from '../config';

import { elasticClient } from './utils/elasticClient';
import { indexRecentLogins } from './jobs/indexRecentLogins';
import { indexResources } from './jobs/indexResources';

/**
 * Just a little helper type to make sure that we're mapping every field in our desired document layout.
 */

const currentMappingProperties: Record<string, MappingProperty> = {
  type: { type: 'keyword' },
  id: { type: 'keyword' },
  lastSeen: { type: 'date' },
  ownerId: { type: 'keyword' },

  objectName: { type: 'text' },
  basicName: { type: 'text' },
  stationId: { type: 'keyword' },
  accountName: { type: 'text' },

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
} as const;

export async function initialSearchIndexSetup() {
  console.log(`Attempting to setup the ${ELASTIC_SEARCH_INDEX_NAME} index in Elastic`);
  const indexExists = await elasticClient.indices.exists({ index: ELASTIC_SEARCH_INDEX_NAME });

  try {
    if (indexExists) {
      await elasticClient.indices.putMapping({
        index: ELASTIC_SEARCH_INDEX_NAME,
        body: {
          properties: currentMappingProperties,
        },
      });
    } else {
      await elasticClient.indices.create({
        index: ELASTIC_SEARCH_INDEX_NAME,
        body: {
          mappings: {
            properties: currentMappingProperties,
          },
        },
      });
    }
  } catch (e) {
    console.error(e);
  }
}

export async function startIndexer() {
  if (!ENABLE_TEXT_SEARCH) return;

  try {
    await initialSearchIndexSetup();
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Failed to start search indexer with error: ${err.message}`);
    }
  }

  setTimeout(() => indexResources(), 0);
  setInterval(() => indexResources(), 1000 * 60 * 30);

  setTimeout(() => indexRecentLogins(), 0);
  setInterval(() => indexRecentLogins(), SEARCH_INDEXER_INTERVAL);
}
