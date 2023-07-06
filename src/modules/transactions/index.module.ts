import { Module } from '@core/moduleTypes';
import { NonEmptyArray } from 'type-graphql';

import router from './routes';

const transactionsModule: Module = () => {
  const resolvers: NonEmptyArray<string> = [`${__dirname}/resolvers/*.{js,ts}`];

  return { moduleName: 'Transactions', resolvers, routes: [router] };
};

export default transactionsModule;
