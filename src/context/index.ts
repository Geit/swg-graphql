import { API_KEY_PREFIX, apiKeyAuth } from './api-key-auth';
import { kibanaAuthorisationContext } from './kibana-auth';
import { SWGGraphqlContextFunction } from './types';

import { DISABLE_AUTH } from '@core/config';
import { getAuthRegistry, Permission } from '@core/auth';

export const getRequestContext: SWGGraphqlContextFunction = params => {
  if (DISABLE_AUTH) {
    return Promise.resolve({
      permissions: new Set<Permission>(getAuthRegistry().allPermissions),
      isAuthenticated: true,
    });
  }

  if (
    typeof params.req.headers.authorization === 'string' &&
    params.req.headers.authorization.startsWith(API_KEY_PREFIX)
  ) {
    return apiKeyAuth(params);
  }

  return kibanaAuthorisationContext(params);
};
