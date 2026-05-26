import { inProcessGqlClient } from '@core/services/inProcessGqlClient';

import { getSdk } from './graphql.generated';

const gqlSdk = getSdk(inProcessGqlClient);

export default gqlSdk;
export * from './graphql.generated';
