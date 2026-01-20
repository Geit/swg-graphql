import { Container } from 'typedi';
import { NonEmptyArray } from 'type-graphql';

import { startJobs } from './jobs';
import { initialMarketIndexSetup } from './migrations';
import { SearchAttributeService } from './services/SearchAttributeService';

import { Module } from '@core/moduleTypes';
import { ENABLE_TEXT_SEARCH } from '@core/config';

const marketModule: Module = async () => {
  if (!ENABLE_TEXT_SEARCH) return null;

  // Initialize the SearchAttributeService with datatable data
  const searchAttributeService = Container.get(SearchAttributeService);
  try {
    await searchAttributeService.initialize();
  } catch (err) {
    console.error(`Failed to initialize SearchAttributeService: ${err instanceof Error ? err.message : err}`);
    // Continue anyway - the service handles initialization failure gracefully
  }

  try {
    await initialMarketIndexSetup();
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Failed to setup market index with error: ${err.message}`);
      return null;
    }
  }

  const { queues } = await startJobs();

  const resolvers: NonEmptyArray<string> = [`${__dirname}/resolvers/*.{js,ts}`];

  return { moduleName: 'Market Search', queues, resolvers };
};

export default marketModule;
