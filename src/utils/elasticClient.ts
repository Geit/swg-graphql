import { Client } from '@elastic/elasticsearch';
import { SearchResponse } from '@elastic/elasticsearch/lib/api/types';

import { ELASTIC_SEARCH_AUTH, ELASTIC_SEARCH_URL } from '../config';

import { isPresent } from './utility-types';

export const elasticClient = new Client({
  node: ELASTIC_SEARCH_URL,
  auth: JSON.parse(ELASTIC_SEARCH_AUTH),
});

export const transformElasticResponse = <T>(elasticResponse: SearchResponse<T>) => {
  const total = elasticResponse.hits?.total;
  const totalResults = (typeof total === 'object' ? total.value : total) ?? 0;

  return {
    totalResults,
    results: elasticResponse.hits.hits.map(hit => hit._source).filter(isPresent),
  };
};
