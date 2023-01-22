import { ELASTIC_SEARCH_INDEX_NAME, ENABLE_TEXT_SEARCH } from '@core/config';
import { elasticClient } from '@core/utils/elasticClient';
import { Module } from '@core/moduleTypes';
import { NonEmptyArray } from 'type-graphql';

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

export const galaxySearchModule: Module = async () => {
  if (!ENABLE_TEXT_SEARCH) return null;

  try {
    await initialSearchIndexSetup();
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Failed to start search indexer with error: ${err.message}`);
      return null;
    }
  }

  const { queues } = await startJobs();

  const resolvers: NonEmptyArray<string> = [`${__dirname}/resolvers/*.{js,ts}`];

  return { moduleName: 'galaxySearch', queues, resolvers };
};
