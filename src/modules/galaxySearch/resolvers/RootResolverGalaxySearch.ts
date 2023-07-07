import { Arg, Authorized, Int, Query, Resolver } from 'type-graphql';
import { Inject, Service } from 'typedi';
import { ServerObjectService } from '@core/services/ServerObjectService';
import { ResourceTypeService } from '@core/services/ResourceTypeService';
import { Account } from '@core/types';
import { isPresent } from '@core/utils/utility-types';

import { SearchResultDetails, DateRangeInput, IntRangeInput } from '../types';
import { SearchService } from '../services/SearchService';

@Service()
@Resolver()
export class RootResolver {
  @Inject()
  private readonly objectService: ServerObjectService;
  @Inject()
  private readonly searchService: SearchService;
  @Inject()
  private readonly resourceTypeService: ResourceTypeService;

  @Query(() => SearchResultDetails, { nullable: false })
  @Authorized()
  async search(
    @Arg('searchText', { nullable: false }) searchText: string,
    @Arg('searchTextIsEsQuery', { defaultValue: false }) searchTextIsEsQuery: boolean,
    @Arg('from', () => Int, { defaultValue: 0 }) from: number,
    @Arg('size', () => Int, { defaultValue: 25 }) size: number,
    @Arg('types', () => [String], { nullable: true }) types?: string[],
    @Arg('resourceAttributes', () => [IntRangeInput], { nullable: true }) resourceAttributes?: IntRangeInput[],
    @Arg('resourceDepletionDate', () => DateRangeInput, { nullable: true }) resourceDepletionDate?: DateRangeInput
  ): Promise<SearchResultDetails> {
    const rawResults = await this.searchService.search({
      searchText,
      searchTextIsEsQuery,
      from,
      size,
      types,
      resourceAttributes,
      resourceDepletionDate,
    });

    if (!rawResults)
      return {
        totalResultCount: 0,
        results: null,
      };

    const results = await Promise.all(
      rawResults.hits.hits.flatMap(result => {
        if (!result._source || !result._source.id) return [];

        if (result._source.type === 'Object') {
          return this.objectService.getOne(result._source.id);
        }

        if (result._source.type === 'ResourceType') {
          return this.resourceTypeService.getOne(result._source.id);
        }

        if (result._source.type === 'Account') {
          return Object.assign(new Account(), {
            id: parseInt(result._source.id),
          });
        }

        return null;
      })
    );

    const presentResults = results.filter(isPresent);

    const pureOidRegex = searchTextIsEsQuery ? /"query":"(\d+)"/ : /^\d+$/;

    if (presentResults.length === 0 && searchText.trim().match(pureOidRegex)?.[1]) {
      const exactOidMatch = await this.objectService.getOne(searchText.trim());

      if (exactOidMatch) presentResults.push(exactOidMatch);
    }

    const total = rawResults?.hits?.total;
    const totalResultCount = (typeof total === 'object' ? total.value : total) ?? 0;

    return {
      totalResultCount,
      results: presentResults,
    };
  }
}
