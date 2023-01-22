import { Module } from '@core/moduleTypes';

import { captureLogin } from './routes';

export const loginsModule: Module = () => {
  return { moduleName: 'logins', routes: [captureLogin] };
};
