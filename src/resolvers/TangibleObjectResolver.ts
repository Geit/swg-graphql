import { FieldResolver, Resolver, ResolverInterface, Root, ObjectType, Float, Field, Int } from 'type-graphql';
import { Service } from 'typedi';

import { TangibleObjectService } from '../services/TangibleObjectService';
import { ServerObjectService } from '../services/ServerObjectService';
import { ITangibleObject } from '../types';
import { IServerObject } from '../types/ServerObject';
import { ShipPartStatService } from '../services/ShipPartStatService';

@ObjectType()
export class ShipPartSummary {
  @Field()
  isReverseEngineered: boolean;

  @Field(() => Int)
  reverseEngineeringLevel: number;

  @Field(() => [ShipPartStat])
  stats: ShipPartStat[];

  @Field(() => Float)
  headlinePercentile: number;
}

@ObjectType()
class ShipPartStat {
  @Field()
  name!: string;

  @Field(() => Float)
  value: number;

  @Field(() => Float, { nullable: true })
  percentile: number | null;
}

@Resolver(() => ITangibleObject)
@Service()
export class TangibleObjectResolver implements ResolverInterface<ITangibleObject> {
  constructor(
    private readonly tangibleObjectService: TangibleObjectService,
    private readonly objectService: ServerObjectService,
    private readonly shipPartStat: ShipPartStatService
  ) {
    // Do nothing
  }

  @FieldResolver()
  async ownerId(@Root() object: IServerObject) {
    const tangible = await this.tangibleObjectService.load(object.id);
    return tangible?.OWNER_ID ?? null;
  }

  @FieldResolver()
  async visible(@Root() object: IServerObject) {
    const tangible = await this.tangibleObjectService.load(object.id);
    return tangible?.VISIBLE === 'Y';
  }

  @FieldResolver()
  async appearanceData(@Root() object: IServerObject) {
    const tangible = await this.tangibleObjectService.load(object.id);
    return tangible?.APPEARANCE_DATA ?? null;
  }

  @FieldResolver()
  async interestRadius(@Root() object: IServerObject) {
    const tangible = await this.tangibleObjectService.load(object.id);
    return tangible?.INTEREST_RADIUS ?? null;
  }

  @FieldResolver()
  async pvpType(@Root() object: IServerObject) {
    const tangible = await this.tangibleObjectService.load(object.id);
    return tangible?.PVP_TYPE ?? null;
  }

  @FieldResolver()
  async pvpFaction(@Root() object: IServerObject) {
    const tangible = await this.tangibleObjectService.load(object.id);
    return tangible?.PVP_FACTION ?? null;
  }

  @FieldResolver()
  async damageTaken(@Root() object: IServerObject) {
    const tangible = await this.tangibleObjectService.load(object.id);
    return tangible?.DAMAGE_TAKEN ?? null;
  }

  @FieldResolver()
  async customAppearance(@Root() object: IServerObject) {
    const tangible = await this.tangibleObjectService.load(object.id);
    return tangible?.CUSTOM_APPEARANCE ?? null;
  }

  @FieldResolver()
  async count(@Root() object: IServerObject) {
    const tangible = await this.tangibleObjectService.load(object.id);

    return tangible?.COUNT ?? null;
  }

  @FieldResolver()
  async condition(@Root() object: IServerObject) {
    const tangible = await this.tangibleObjectService.load(object.id);
    return tangible?.CONDITION ?? null;
  }

  @FieldResolver()
  async creatorId(@Root() object: IServerObject) {
    const tangible = await this.tangibleObjectService.load(object.id);
    return tangible?.CREATOR_ID ?? null;
  }

  @FieldResolver()
  async sourceDraftSchematicId(@Root() object: IServerObject) {
    const tangible = await this.tangibleObjectService.load(object.id);
    return tangible?.SOURCE_DRAFT_SCHEMATIC ?? null;
  }

  @FieldResolver(() => IServerObject, { nullable: true })
  async owner(@Root() object: IServerObject) {
    const tangible = await this.tangibleObjectService.load(object.id);

    if (!tangible) {
      return null;
    }

    return this.objectService.getOne(tangible.OWNER_ID) ?? null;
  }

  @FieldResolver(() => IServerObject, { nullable: true })
  async creator(@Root() object: IServerObject) {
    const tangible = await this.tangibleObjectService.load(object.id);

    if (!tangible) {
      return null;
    }

    return this.objectService.getOne(tangible.CREATOR_ID) ?? null;
  }

  @FieldResolver(() => ShipPartSummary, { nullable: true })
  shipPartSummary(@Root() object: IServerObject) {
    if (!object.templateId) return null;

    return this.shipPartStat.lookupShipPartStats(object.id, object.templateId);
  }
}
