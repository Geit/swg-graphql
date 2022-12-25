import { Service } from 'typedi';
import esb, { Query } from 'elastic-builder';

import { ELASTIC_SEARCH_INDEX_NAME, ENABLE_TEXT_SEARCH } from '../config';
import { elasticClient } from '../utils/elasticClient';

interface IntRangeQueryWithCustomKey {
  key: string;
  gte?: number;
  lte?: number;
}

interface StringRangeQuery {
  gte?: string;
  lte?: string;
}

interface SearchFilters {
  searchText: string;
  types?: string[]; // SearchDocument['type'][];
  resourceAttributes?: IntRangeQueryWithCustomKey[];
  resourceDepletionDate?: StringRangeQuery;
  from: number;
  size: number;
}

@Service()
export class SearchService {
  private elastic = elasticClient;

  private async findElasticRecords(filters: SearchFilters) {
    const searchText = filters.searchText.trim();

    const elasticBody = esb.requestBodySearch();

    const mustQueries: Query[] = [];
    const shouldQueries: Query[] = [
      esb
        .functionScoreQuery()
        .query(esb.matchAllQuery())
        .functions([
          esb.weightScoreFunction().filter(esb.matchQuery('type', 'Account')).weight(30),
          esb.weightScoreFunction().filter(esb.existsQuery('stationId')).weight(10),
        ])
        .boostMode('multiply'),
    ];
    const filterQueries: Query[] = [];

    if (filters.types) {
      filters.types.forEach(t => mustQueries.push(esb.termQuery('type', t)));
    }

    if (searchText) {
      mustQueries.push(
        esb
          .disMaxQuery()
          .queries([
            esb
              .multiMatchQuery()
              .query(searchText)
              .type('phrase_prefix')
              .fields(['basicName^2', 'objectName^3', 'accountName^3', 'resourceName']),
            esb
              .multiMatchQuery()
              .query(searchText)
              .fuzziness('AUTO')
              .fields(['accountName^3', 'resourceName', 'resourceClass', 'resourceClassId']),
            esb.multiMatchQuery().query(searchText).fields(['id^5', 'stationId^5']),
          ])
          .tieBreaker(1.0)
      );
    }

    if (filters.resourceAttributes) {
      filters.resourceAttributes.forEach(ra => {
        const query = esb.rangeQuery(`resourceAttributes.${ra.key}`);

        if (ra.gte) query.gte(ra.gte);
        if (ra.lte) query.lte(ra.lte);

        filterQueries.push(query);
      });
    }

    if (filters.resourceDepletionDate) {
      const rdd = filters.resourceDepletionDate;

      const query = esb.rangeQuery(`resourceDepletedTime`);

      if (rdd.gte) query.gte(rdd.gte);
      if (rdd.lte) query.lte(rdd.lte);

      filterQueries.push(query);
    }

    elasticBody.query(esb.boolQuery().must(mustQueries).filter(filterQueries).should(shouldQueries));

    const elasticResponse = await this.elastic.search<any>({
      index: ELASTIC_SEARCH_INDEX_NAME,
      size: filters.size,
      from: filters.from,
      body: elasticBody.toJSON(),
    });

    return elasticResponse;
  }

  async search(filters: SearchFilters) {
    if (!ENABLE_TEXT_SEARCH) {
      return null;
    }

    const results = await this.findElasticRecords(filters);

    return results;
  }
}
