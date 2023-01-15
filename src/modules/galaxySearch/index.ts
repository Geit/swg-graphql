import { ELASTIC_SEARCH_INDEX_NAME, ENABLE_TEXT_SEARCH } from '../../config';

import { elasticClient } from './utils/elasticClient';
import { currentMappingProperties } from './migrations/currentMapping';
import { startJobs } from './jobs';

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

export async function startModule() {
  if (!ENABLE_TEXT_SEARCH) return { queues: [], resolvers: [] };

  try {
    await initialSearchIndexSetup();
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Failed to start search indexer with error: ${err.message}`);
    }
  }

  const { queues } = await startJobs();

  const resolvers = [`${__dirname}/resolvers/*.{js,ts}`];

  return { queues, resolvers };
}
