import { Service } from 'typedi';

import { ELASTIC_SEARCH_INDEX_NAME, ENABLE_TEXT_SEARCH } from '../config';
import { elasticClient } from '../elasticSearchIndex/elastic';
import { SearchDocument } from '../elasticSearchIndex/searchIndexer';

interface SearchFilters {
  searchText: string;
  from: number;
  size: number;
}

interface ElasticSearchResult<SearchHitType> {
  took: number;
  timed_out: boolean;
  hits: {
    total: {
      value: number;
      relation: string;
    };
    hits: {
      _index: string;
      _type: string;
      _id: string;
      _score: number;
      _source: SearchHitType;
    }[];
  };
}

@Service()
export class SearchService {
  private elastic = elasticClient;

  async search(filters: SearchFilters) {
    const searchText = filters.searchText.trim();

    if (!ENABLE_TEXT_SEARCH) {
      return null;
    }

    /* eslint-disable camelcase */
    const { body: elasticResponse } = await this.elastic.search<ElasticSearchResult<SearchDocument>>({
      index: ELASTIC_SEARCH_INDEX_NAME,
      size: filters.size,
      from: filters.from,
      body: {
        query: {
          bool: {
            must: [
              {
                dis_max: {
                  queries: [
                    {
                      multi_match: {
                        query: searchText,
                        type: 'phrase_prefix',
                        fields: ['basicName^2', 'objectName^3', 'accountName^3'],
                      },
                    },
                    {
                      multi_match: {
                        query: searchText,
                        fuzziness: 'AUTO',
                        fields: ['id^5', 'stationId', 'accountName^3'],
                      },
                    },
                  ],
                  tie_breaker: 1.0,
                },
              },
            ],
            should: [
              {
                rank_feature: {
                  field: 'relevancyBump',
                  linear: {},
                },
              },
            ],
          },
        },
      },
    });
    /* eslint-enable */

    return elasticResponse;
  }
}
