import { GraphQLError } from 'graphql';

import { ELASTIC_KIBANA_INDEX, ELASTIC_REQUIRED_PRIVILEGE, ELASTIC_SEARCH_URL } from '../config';

import { SWGGraphqlContextFunction } from './types';

import { ROLES } from '@core/auth';

/**
 * Partial response body for the Elastic "Has Privlages" API.
 *
 * @see https://www.elastic.co/guide/en/elasticsearch/reference/current/security-api-has-privileges.html
 */
interface ElasticHasPrivlagesResponse {
  has_all_requested?: boolean;
}

export const checkKibanaToken = async (token: string) => {
  const response = await fetch(`${ELASTIC_SEARCH_URL}_security/user/_has_privileges`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization: token,
    },
    body: JSON.stringify({
      application: [
        {
          application: `kibana-${ELASTIC_KIBANA_INDEX}`,
          privileges: [ELASTIC_REQUIRED_PRIVILEGE],
          resources: ['*'],
        },
      ],
    }),
  }).catch(() => {
    throw new GraphQLError('Error while confirming authorization', {
      extensions: {
        code: 'FORBIDDEN',
        myExtension: 'swg-graphql',
      },
    });
  });

  if (!response.ok) {
    throw new GraphQLError('Error while confirming authorization', {
      extensions: {
        code: 'FORBIDDEN',
        myExtension: 'swg-graphql',
      },
    });
  }

  const result = (await response.json()) as ElasticHasPrivlagesResponse;

  if (!result.has_all_requested) {
    throw new GraphQLError('Incorrect authorization', {
      extensions: {
        code: 'FORBIDDEN',
        myExtension: 'swg-graphql',
      },
    });
  }
};

/**
 * Verifies that the incoming request has an authorisation header attached, and then forwards
 * the request to Elastic to verify that the user has the required permission to query the GraphQL
 * Server.
 *
 * This is _very_ basic auth. If using this in production, you should consider maintaining an operation registry
 * and validating that the incoming client has permissions to execute the operations.
 *
 * @returns undefined if successful.
 * @throws AuthenticationError
 */
export const kibanaAuthorisationContext: SWGGraphqlContextFunction = async params => {
  if (!params.req.headers.authorization) {
    return {
      isAuthenticated: false,
    };
  }

  await checkKibanaToken(params.req.headers.authorization);

  return {
    // Kibana auth is superuser for now.
    roles: new Set(Object.values(ROLES)),
    isAuthenticated: true,
  };
};
