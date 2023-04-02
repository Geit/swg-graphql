import { ENABLE_TEXT_SEARCH } from '@core/config';
import { Module } from '@core/moduleTypes';
import { NonEmptyArray } from 'type-graphql';

import { startJobs } from './jobs';
import { initialIndexSetup } from './migrations';

export const galaxySearchModule: Module = async () => {
  if (!ENABLE_TEXT_SEARCH) return null;

  try {
    await initialIndexSetup();
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
