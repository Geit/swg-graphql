import { GraphQLClient } from 'graphql-request';

import { TRANSACTIONS_GQL_API_KEY } from '../config';

import { getSdk } from './graphql.generated';

const client = new GraphQLClient('http://localhost:4000/graphql', {
  headers: { Authorization: TRANSACTIONS_GQL_API_KEY },
  keepalive: true,
});

const gqlSdk = getSdk(client);

export default gqlSdk;
