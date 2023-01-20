import got from 'got';
import { GraphQLError } from 'graphql';

import { DISABLE_AUTH, ELASTIC_KIBANA_INDEX, ELASTIC_REQUIRED_PRIVILEGE, ELASTIC_SEARCH_URL } from '../config';

import { SWGGraphqlContextFunction } from './types';

/**
 * Partial response body for the Elastic "Has Privlages" API.
 *
 * @see https://www.elastic.co/guide/en/elasticsearch/reference/current/security-api-has-privileges.html
 */
interface ElasticHasPrivlagesResponse {
  has_all_requested?: boolean;
}

export const checkKibanaToken = async (token: string) => {
  const result = await got<ElasticHasPrivlagesResponse>(`${ELASTIC_SEARCH_URL}_security/user/_has_privileges`, {
    headers: {
      authorization: token,
    },
    allowGetBody: true,
    json: {
      application: [
        {
          application: `kibana-${ELASTIC_KIBANA_INDEX}`,
          privileges: [ELASTIC_REQUIRED_PRIVILEGE],
          resources: ['*'],
        },
      ],
    },
    responseType: 'json',
  }).catch(() => {
    throw new GraphQLError('Error while confirming authorization', {
      extensions: {
        code: 'FORBIDDEN',
        myExtension: 'swg-graphql',
      },
    });
  });

  if (!result.body.has_all_requested) {
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
  if (DISABLE_AUTH) {
    return {};
  }

  if (!params.req.headers.authorization) {
    throw new GraphQLError('Authorization required.', {
      extensions: {
        code: 'FORBIDDEN',
        myExtension: 'swg-graphql',
      },
    });
  }

  await checkKibanaToken(params.req.headers.authorization);

  return {};
};
