import { elasticClient } from '@core/utils/elasticClient';

import { GALAXY_SEARCH_INDEX_NAME } from '../config';

import { currentMappingProperties } from './currentMapping';

export async function initialIndexSetup() {
  console.log(`Attempting to setup the ${GALAXY_SEARCH_INDEX_NAME} index in Elastic`);
  const indexExists = await elasticClient.indices.exists({ index: GALAXY_SEARCH_INDEX_NAME });

  try {
    if (indexExists) {
      await elasticClient.indices.putMapping({
        index: GALAXY_SEARCH_INDEX_NAME,
        body: {
          properties: currentMappingProperties,
        },
      });
    } else {
      await elasticClient.indices.create({
        index: GALAXY_SEARCH_INDEX_NAME,
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
