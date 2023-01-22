import { GraphQLClient } from 'graphql-request';

import { getSdk } from './graphql.generated';

const client = new GraphQLClient('http://omega01.swglegends.com:4000/graphql', {
  headers: { Authorization: 'ApiKey-WhJqcJ9ENjVxVui3u5QdPTz2LZUZqHWX' },
  keepalive: true,
});

const gqlSdk = getSdk(client);

export default gqlSdk;
