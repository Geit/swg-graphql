import { ELASTIC_SEARCH_INDEX_NAME, ENABLE_TEXT_SEARCH, SEARCH_INDEXER_INTERVAL } from '../../config';

import { elasticClient } from './utils/elasticClient';
import { indexRecentLogins } from './jobs/indexRecentLogins';
import { indexResources } from './jobs/indexResources';
import { currentMappingProperties } from './migrations/currentMapping';

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
