import { apiKeyAuth } from './api-key-auth';
import { kibanaAuthorisationContext } from './kibana-auth';
import { SWGGraphqlContextFunction } from './types';

export const getRequestContext: SWGGraphqlContextFunction = async params => {
  if (typeof params.req.headers.authorization === 'string' && params.req.headers.authorization.startsWith('ApiKey-')) {
    await apiKeyAuth(params);
  } else {
    await kibanaAuthorisationContext(params);
  }

  return {};
};
