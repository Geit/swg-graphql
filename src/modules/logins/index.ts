import { Module } from '@core/moduleTypes';

import { captureLogin } from './routes';

export const transactionsModule: Module = () => {
  return { moduleName: 'logins', routes: [captureLogin] };
};
