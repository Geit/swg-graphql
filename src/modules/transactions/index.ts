import { Module } from '@core/moduleTypes';
import { NonEmptyArray } from 'type-graphql';

import router from './routes';

export const transactionsModule: Module = () => {
  const resolvers: NonEmptyArray<string> = [`${__dirname}/resolvers/*.{js,ts}`];

  return { moduleName: 'transactions', resolvers, routes: [router] };
};
