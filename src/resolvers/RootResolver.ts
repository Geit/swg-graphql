import { Arg, Int, Query, Resolver, ID, Field, ObjectType } from 'type-graphql';
import { Inject, Service } from 'typedi';

import { ServerObjectService } from '../services/ServerObjectService';
import { PlayerCreatureObjectService } from '../services/PlayerCreatureObjectService';
import { ResourceTypeService } from '../services/ResourceTypeService';
import { IServerObject, UnenrichedServerObject, Account, PlayerCreatureObject } from '../types';
import { ResourceType, ResourceTypeResult } from '../types/ResourceType';
import TAGIFY from '../utils/tagify';

@ObjectType()
class RecentLoginsResult {
  @Field(() => Int)
  totalResults: number;

  @Field(() => [PlayerCreatureObject])
  results: PlayerCreatureObject[];
}

@Service()
@Resolver()
export class RootResolver {
  @Inject()
  private readonly objectService: ServerObjectService;
  @Inject()
  private readonly resourceTypeService: ResourceTypeService;
  @Inject()
  private readonly playerCreatureService: PlayerCreatureObjectService;

  @Query(() => IServerObject, { nullable: true })
  object(@Arg('objectId', { nullable: false }) objectId: string): Promise<Partial<IServerObject> | null> {
    return this.objectService.getOne(objectId);
  }

  @Query(() => [IServerObject], { nullable: true })
  objects(
    @Arg('limit', () => Int, { defaultValue: 50 }) limit: number,
    @Arg('excludeDeleted', { defaultValue: false }) excludeDeleted: boolean,
    @Arg('objectIds', () => [ID], { nullable: true }) objectIds?: string[],
    @Arg('loadsWithIds', () => [ID], { nullable: true }) loadsWithIds?: string[],
    @Arg('searchText', { nullable: true }) searchText?: string
  ): Promise<Partial<UnenrichedServerObject[]> | null> {
    return this.objectService.getMany({ searchText, limit, excludeDeleted, objectIds, loadsWithIds });
  }

  @Query(() => Account, { nullable: true })
  account(@Arg('stationId', { nullable: false }) accountId: string) {
    return Object.assign(new Account(), {
      id: parseInt(accountId),
    });
  }

  @Query(() => ResourceTypeResult)
  async resources(
    @Arg('limit', () => Int, { defaultValue: 50 }) limit: number,
    @Arg('offset', () => Int, { defaultValue: 0 }) offset: number
  ) {
    const filters = { limit, offset };

    const [count, results] = await Promise.all([
      this.resourceTypeService.countMany(filters),
      this.resourceTypeService.getMany(filters),
    ]);

    return {
      totalResults: count,
      results,
    };
  }

  @Query(() => ResourceType, { nullable: true })
  resource(@Arg('resourceId', { nullable: false }) id: string) {
    return this.resourceTypeService.getOne(id);
  }

  @Query(() => RecentLoginsResult)
  async recentLogins(
    @Arg('limit', () => Int, { defaultValue: 1000 }) limit: number,
    @Arg('offset', () => Int, { defaultValue: 0 }) offset: number,
    @Arg('durationSeconds', () => Int, { defaultValue: 10 * 60 }) durationSeconds: number
  ): Promise<RecentLoginsResult> {
    if (limit > 1000 || limit < 0) throw new Error('Bad `limit` argument');
    if (offset < 0) throw new Error('Bad `offset` argument');

    const results = await this.playerCreatureService.getRecentlyLoggedInCharacters(durationSeconds);

    const limitedResults = results.slice(offset, offset + limit);

    const objects = (await this.objectService.getMany({
      objectIds: limitedResults.map(r => r.CHARACTER_OBJECT.toString()),
      objectTypes: [TAGIFY('CREO')],
      limit,
    })) as PlayerCreatureObject[];

    return {
      totalResults: results.length,
      results: objects,
    };
  }
}
