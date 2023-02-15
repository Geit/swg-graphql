import { apiKeyAuth } from './api-key-auth';
import { kibanaAuthorisationContext } from './kibana-auth';
import { SWGGraphqlContextFunction } from './types';

import { DISABLE_AUTH } from '@core/config';
import { ROLES } from '@core/auth';

export const getRequestContext: SWGGraphqlContextFunction = params => {
  if (DISABLE_AUTH) {
    return Promise.resolve({
      roles: new Set(Object.values(ROLES)),
      isAuthenticated: true,
    });
  }

  if (typeof params.req.headers.authorization === 'string' && params.req.headers.authorization.startsWith('ApiKey-')) {
    return apiKeyAuth(params);
  }

  return kibanaAuthorisationContext(params);
};
