import { Arg, Int, Query, Resolver, Field, ObjectType, Authorized } from 'type-graphql';
import { Inject, Service } from 'typedi';

import { GuildService } from '../services/GuildService';
import { CityService } from '../services/CityService';
import { Guild, City } from '../types';

import { PERMISSIONS } from '@core/auth';

@ObjectType()
class GuildsResult {
  @Field(() => Int)
  totalResults: number;

  @Field(() => [Guild])
  results: Guild[];
}

@ObjectType()
class CitiesResult {
  @Field(() => Int)
  totalResults: number;

  @Field(() => [City])
  results: City[];
}

@Service()
@Resolver()
export class RootResolver {
  @Inject()
  private readonly guildService: GuildService;
  @Inject()
  private readonly cityService: CityService;

  @Query(() => GuildsResult)
  @Authorized([PERMISSIONS.GUILDS_READ])
  async guilds(
    @Arg('limit', () => Int, { defaultValue: 50 }) limit: number,
    @Arg('offset', () => Int, { defaultValue: 0 }) offset: number
  ) {
    if (limit > 1500 || limit < 0) throw new Error('Bad `limit` argument');
    if (offset < 0) throw new Error('Bad `offset` argument');

    const guildsMap = await this.guildService.getAllGuilds();
    const guilds = [...guildsMap.values()];

    const slicedGuilds = guilds.slice(offset, offset + limit);

    return {
      totalResults: guilds.length,
      results: slicedGuilds,
    };
  }

  @Query(() => Guild, { nullable: true })
  @Authorized([PERMISSIONS.GUILDS_READ])
  guild(@Arg('guildId', { nullable: false }) id: string) {
    return this.guildService.getGuild(id);
  }

  @Query(() => CitiesResult)
  @Authorized([PERMISSIONS.CITIES_READ])
  async cities(
    @Arg('limit', () => Int, { defaultValue: 50 }) limit: number,
    @Arg('offset', () => Int, { defaultValue: 0 }) offset: number
  ) {
    if (limit > 1000 || limit < 0) throw new Error('Bad `limit` argument');
    if (offset < 0) throw new Error('Bad `offset` argument');

    const citiesMap = await this.cityService.getAllCities();
    const cities = [...citiesMap.values()];

    const slicedCities = cities.slice(offset, offset + limit);

    return {
      totalResults: cities.length,
      results: slicedCities,
    };
  }

  @Query(() => City, { nullable: true })
  @Authorized([PERMISSIONS.CITIES_READ])
  city(@Arg('cityId', { nullable: false }) id: string) {
    return this.cityService.getCity(id);
  }
}
