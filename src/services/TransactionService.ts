import { Service } from 'typedi';
import esb, { Query } from 'elastic-builder';
import z from 'zod';

import { Transaction, TransactionServiceResponse } from '../types/Transaction';
import { isPresent } from '../utils/utility-types';

import { elasticClient } from './elasticClient';

const filterSchema = z.object({
  searchText: z.string().nullable().optional(),
  arePartiesSameAccount: z.boolean().nullable().optional().default(null),
  size: z.number().positive().optional().default(50),
  from: z.number().nonnegative().optional().default(0),
  fromDate: z.string().optional().default('now-30d'),
  untilDate: z.string().optional().default('now'),
  parties: z.array(z.string()).optional().nullable(),
  sortDirection: z.enum(['ASC', 'DESC']).optional().default('DESC'),
  sortField: z.enum(['@timestamp', 'transactionValue']).optional().default('@timestamp'),
});

export type GetManyFilters = z.input<typeof filterSchema>;

@Service()
export class TransactionService {
  private elastic = elasticClient;

  async getTradingPartners(stationId: string, fromDate: string, untilDate: string): Promise<string[]> {
    const AGGREGATION_NAME = 'parties';
    const elasticBody = esb
      .requestBodySearch()
      .size(0)
      .aggregation(esb.termsAggregation(AGGREGATION_NAME, 'parties.stationId').size(1000));

    const filterQueries: Query[] = [];

    filterQueries.push(esb.rangeQuery('@timestamp').gte(fromDate).lt(untilDate));
    filterQueries.push(esb.matchQuery('arePartiesSameAccount', 'false'));
    filterQueries.push(esb.multiMatchQuery(['parties.name', 'parties.stationId', 'parties.oid'], stationId));

    elasticBody.query(esb.boolQuery().filter(filterQueries));

    const elasticResponse = await this.elastic.search<Transaction, { parties: { buckets: { key: string }[] } }>({
      index: 'transaction-logging-alias',
      body: elasticBody.toJSON(),
    });

    if (!elasticResponse.aggregations) return [];

    return elasticResponse.aggregations[AGGREGATION_NAME].buckets.map(k => k.key).filter(k => k !== stationId);
  }

  async getMany(unparsedFilters: GetManyFilters): Promise<TransactionServiceResponse> {
    const filters = filterSchema.parse(unparsedFilters);

    const elasticBody = esb
      .requestBodySearch()
      .from(filters.from)
      .size(filters.size)
      .sort(esb.sort(filters.sortField, filters.sortDirection));

    const shouldQueries: Query[] = [];
    let shouldMatch = 0;
    const filterQueries: Query[] = [];

    if (filters.arePartiesSameAccount !== null) {
      filterQueries.push(esb.matchQuery('arePartiesSameAccount', String(filters.arePartiesSameAccount)));
    }

    if (filters.parties) {
      shouldQueries.push(
        ...filters.parties.map(partyId =>
          esb.multiMatchQuery(['parties.name', 'parties.stationId', 'parties.oid'], partyId).type('phrase')
        )
      );
      shouldMatch = filters.parties.length;
    }

    const searchText = filters.searchText?.trim();
    if (searchText) {
      shouldQueries.push(
        esb
          .multiMatchQuery(
            ['parties.name', 'parties.itemsReceived.name', 'parties.itemsReceived.basicName'],
            searchText
          )
          .type('phrase_prefix'),
        esb.multiMatchQuery(
          ['parties.stationId', 'parties.oid', 'parties.itemsReceived.oid', 'parties.itemsReceived.template'],
          searchText
        )
      );
      shouldMatch += 1;
    }

    filterQueries.push(esb.rangeQuery('@timestamp').gte(filters.fromDate).lt(filters.untilDate));

    elasticBody.query(esb.boolQuery().should(shouldQueries).minimumShouldMatch(shouldMatch).filter(filterQueries));

    const elasticResponse = await this.elastic.search<Transaction>({
      index: 'transaction-logging-alias',
      body: elasticBody.toJSON(),
    });

    const total = elasticResponse.hits?.total;
    const totalResults = (typeof total === 'object' ? total.value : total) ?? 0;

    return {
      totalResults,
      results: elasticResponse.hits.hits.map(hit => hit._source).filter(isPresent),
    };
  }
}
