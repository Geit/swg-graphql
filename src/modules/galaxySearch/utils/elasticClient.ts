import { Client } from '@elastic/elasticsearch';

import { ELASTIC_SEARCH_AUTH, ELASTIC_SEARCH_URL } from '../../../config';

export const elasticClient = new Client({
  node: ELASTIC_SEARCH_URL,
  auth: JSON.parse(ELASTIC_SEARCH_AUTH),
});
