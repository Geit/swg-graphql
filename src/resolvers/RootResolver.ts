import { Arg, Int, Query, Resolver } from 'type-graphql';
import { Service } from 'typedi';

import { GuildService } from '../services/GuildService';
import { CityService } from '../services/CityService';
import { SearchService } from '../services/SearchService';
import { ServerObjectService } from '../services/ServerObjectService';
import { IServerObject, UnenrichedServerObject, SearchResultDetails, Account, Guild, City } from '../types';
import { isPresent } from '../utils/utility-types';

@Service()
@Resolver()
export class RootResolver {
  constructor(
    // constructor injection of a service
    private readonly objectService: ServerObjectService,
    private readonly searchService: SearchService,
    private readonly guildService: GuildService,
    private readonly cityService: CityService
  ) {
    // Do nothing
  }

  @Query(() => IServerObject, { nullable: true })
  object(@Arg('objectId', { nullable: false }) objectId: string): Promise<Partial<IServerObject> | null> {
    return this.objectService.getOne(objectId);
  }

  @Query(() => [IServerObject], { nullable: true })
  objects(
    @Arg('searchText', { nullable: false }) searchText: string,
    @Arg('limit', () => Int, { defaultValue: 50 }) limit: number,
    @Arg('excludeDeleted', { defaultValue: false }) excludeDeleted: boolean
  ): Promise<Partial<UnenrichedServerObject[]> | null> {
    return this.objectService.getMany({ searchText, limit, excludeDeleted });
  }

  @Query(() => Account, { nullable: true })
  account(@Arg('stationId', { nullable: false }) accountId: string) {
    return Object.assign(new Account(), {
      id: parseInt(accountId),
    });
  }

  @Query(() => SearchResultDetails, { nullable: false })
  async search(
    @Arg('searchText', { nullable: false }) searchText: string,
    @Arg('from', () => Int, { defaultValue: 0 }) from: number,
    @Arg('size', () => Int, { defaultValue: 25 }) size: number
  ): Promise<SearchResultDetails> {
    const rawResults = await this.searchService.search({ searchText, from, size });

    if (!rawResults)
      return {
        totalResultCount: 0,
        results: null,
      };

    const results = await Promise.all(
      rawResults.hits.hits.map(result => {
        if (result._source.type === 'Object') {
          return this.objectService.getOne(result._source.id);
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

    return {
      totalResultCount: rawResults.hits.total.value,
      results: presentResults,
    };
  }

  @Query(() => [Guild], { nullable: true })
  async guilds() {
    const guilds = await this.guildService.getAllGuilds();
    return guilds ? [...guilds].map(([, val]) => val) : null;
  }

  @Query(() => Guild, { nullable: true })
  async guild(@Arg('id', { nullable: false }) id: string) {
    const guilds = await this.guildService.getAllGuilds();

    return guilds?.get(id) ?? null;
  }

  @Query(() => [City], { nullable: true })
  async cities() {
    const cities = await this.cityService.getAllCities();
    return cities ? [...cities].map(([, val]) => val) : null;
  }

  @Query(() => City, { nullable: true })
  async city(@Arg('id', { nullable: false }) id: string) {
    const cities = await this.cityService.getAllCities();

    return cities?.get(id) ?? null;
  }
}
