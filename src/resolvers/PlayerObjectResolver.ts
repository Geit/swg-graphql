import { Arg, FieldResolver, Resolver, ResolverInterface, Root } from 'type-graphql';
import { Service } from 'typedi';

import { PlayerObjectService } from '../services/PlayerObjectService';
import { PlayerObject, IServerObject } from '../types';

@Resolver(() => PlayerObject)
@Service()
export class PlayerObjectResolver implements ResolverInterface<PlayerObject> {
  constructor(private readonly playerObjectService: PlayerObjectService) {
    // Do nothing
  }

  @FieldResolver()
  async stationId(@Root() object: IServerObject) {
    const plyr = await this.playerObjectService.load(object.id);

    return plyr?.STATION_ID ?? null;
  }

  @FieldResolver()
  async personalProfileId(@Root() object: IServerObject) {
    const plyr = await this.playerObjectService.load(object.id);

    return plyr?.PERSONAL_PROFILE_ID ?? null;
  }

  @FieldResolver()
  async characterProfileId(@Root() object: IServerObject) {
    const plyr = await this.playerObjectService.load(object.id);

    return plyr?.CHARACTER_PROFILE_ID ?? null;
  }

  @FieldResolver()
  async skillTitle(@Root() object: IServerObject) {
    const plyr = await this.playerObjectService.load(object.id);

    if (!plyr || plyr.SKILL_TITLE.trim().length === 0) return null;

    return plyr?.SKILL_TITLE ?? null;
  }

  @FieldResolver()
  async bornDate(@Root() object: IServerObject) {
    const plyr = await this.playerObjectService.load(object.id);

    return plyr?.BORN_DATE ?? null;
  }

  @FieldResolver()
  async playedTime(@Root() object: IServerObject) {
    const plyr = await this.playerObjectService.load(object.id);

    return plyr?.PLAYED_TIME ?? null;
  }

  @FieldResolver()
  async forceRegenRate(@Root() object: IServerObject) {
    const plyr = await this.playerObjectService.load(object.id);

    return plyr?.FORCE_REGEN_RATE ?? null;
  }

  @FieldResolver()
  async forcePower(@Root() object: IServerObject) {
    const plyr = await this.playerObjectService.load(object.id);

    return plyr?.FORCE_POWER ?? null;
  }

  @FieldResolver()
  async maxForcePower(@Root() object: IServerObject) {
    const plyr = await this.playerObjectService.load(object.id);

    return plyr?.MAX_FORCE_POWER ?? null;
  }

  @FieldResolver()
  async numLots(@Root() object: IServerObject) {
    const plyr = await this.playerObjectService.load(object.id);

    return plyr?.NUM_LOTS ?? null;
  }

  @FieldResolver()
  async activeQuests(@Root() object: IServerObject) {
    const plyr = await this.playerObjectService.load(object.id);

    return plyr?.ACTIVE_QUESTS ?? null;
  }

  @FieldResolver()
  async completedQuests(@Root() object: IServerObject) {
    const plyr = await this.playerObjectService.load(object.id);

    return plyr?.COMPLETED_QUESTS ?? null;
  }

  @FieldResolver()
  async currentQuest(@Root() object: IServerObject) {
    const plyr = await this.playerObjectService.load(object.id);

    return plyr?.CURRENT_QUEST ?? null;
  }

  @FieldResolver()
  async quests(@Root() object: IServerObject) {
    const plyr = await this.playerObjectService.load(object.id);

    if (!plyr) return null;

    const joinedResult = Object.entries(plyr)
      .filter(([key]) => key.startsWith('QUESTS'))
      .reduce((acc, [, val]) => `${acc}${val}`, '')
      .trim();

    return joinedResult ?? null;
  }

  @FieldResolver()
  async roleIconChoice(@Root() object: IServerObject) {
    const plyr = await this.playerObjectService.load(object.id);

    return plyr?.ROLE_ICON_CHOICE ?? null;
  }

  @FieldResolver()
  async skillTemplate(@Root() object: IServerObject) {
    const plyr = await this.playerObjectService.load(object.id);

    return plyr?.SKILL_TEMPLATE ?? null;
  }

  @FieldResolver()
  async workingSkill(@Root() object: IServerObject) {
    const plyr = await this.playerObjectService.load(object.id);

    return plyr?.WORKING_SKILL ?? null;
  }

  @FieldResolver()
  async currentGcwPoints(@Root() object: IServerObject) {
    const plyr = await this.playerObjectService.load(object.id);

    return plyr?.CURRENT_GCW_POINTS ?? null;
  }

  @FieldResolver()
  async currentGcwRating(@Root() object: IServerObject) {
    const plyr = await this.playerObjectService.load(object.id);

    return plyr?.CURRENT_GCW_RATING ?? null;
  }

  @FieldResolver()
  async currentPvpKills(@Root() object: IServerObject) {
    const plyr = await this.playerObjectService.load(object.id);

    return plyr?.CURRENT_PVP_KILLS ?? null;
  }

  @FieldResolver()
  async lifetimeGcwPoints(@Root() object: IServerObject) {
    const plyr = await this.playerObjectService.load(object.id);

    return plyr?.LIFETIME_PVP_KILLS ?? null;
  }

  @FieldResolver()
  async maxGcwImperialRating(@Root() object: IServerObject) {
    const plyr = await this.playerObjectService.load(object.id);

    return plyr?.MAX_GCW_IMPERIAL_RATING ?? null;
  }

  @FieldResolver()
  async maxGcwRebelRating(@Root() object: IServerObject) {
    const plyr = await this.playerObjectService.load(object.id);

    return plyr?.MAX_GCW_REBEL_RATING ?? null;
  }

  @FieldResolver()
  async lifetimePvpKills(@Root() object: IServerObject) {
    const plyr = await this.playerObjectService.load(object.id);

    return plyr?.LIFETIME_PVP_KILLS ?? null;
  }

  @FieldResolver()
  async nextGcwRatingCalcTime(@Root() object: IServerObject) {
    const plyr = await this.playerObjectService.load(object.id);

    return plyr?.NEXT_GCW_RATING_CALC_TIME ?? null;
  }

  @FieldResolver()
  async collections(@Root() object: IServerObject) {
    const plyr = await this.playerObjectService.load(object.id);

    if (!plyr) return null;

    const joinedResult = Object.entries(plyr)
      .filter(([key]) => key.startsWith('COLLECTIONS'))
      .reduce((acc, [, val]) => `${acc}${val}`, '')
      .trim();

    return joinedResult ?? null;
  }

  @FieldResolver()
  async showBackpack(@Root() object: IServerObject) {
    const plyr = await this.playerObjectService.load(object.id);

    return plyr?.SHOW_BACKPACK === 'Y';
  }

  @FieldResolver()
  async showHelmet(@Root() object: IServerObject) {
    const plyr = await this.playerObjectService.load(object.id);

    return plyr?.SHOW_HELMET === 'Y';
  }

  @FieldResolver(() => String)
  resolvedName(
    /* eslint-disable @typescript-eslint/no-unused-vars */
    @Root() object: IServerObject,
    @Arg('resolveCustomNames', { defaultValue: false }) _resolveCustomNames: boolean
    /* eslint-enable */
  ) {
    // Player objects never have a name.
    return 'Player Object';
  }
}
