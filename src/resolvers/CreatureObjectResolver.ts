import { FieldResolver, Resolver, ResolverInterface, Root } from 'type-graphql';
import { Service } from 'typedi';

import { CreatureObjectService } from '../services/CreatureObjectService';
import { CreatureObject, Attributes } from '../types/CreatureObject';
import { IServerObject, Location } from '../types/ServerObject';

@Resolver(() => CreatureObject)
@Service()
export class CreatureObjectResolver implements ResolverInterface<CreatureObject> {
  constructor(private readonly creatureObjectService: CreatureObjectService) {
    // Do nothing
  }

  @FieldResolver()
  async scaleFactor(@Root() object: IServerObject) {
    const creature = await this.creatureObjectService.load(object.id);
    return creature?.SCALE_FACTOR ?? null;
  }

  @FieldResolver()
  async states(@Root() object: IServerObject) {
    const creature = await this.creatureObjectService.load(object.id);
    return creature?.STATES ?? null;
  }

  @FieldResolver()
  async posture(@Root() object: IServerObject) {
    const creature = await this.creatureObjectService.load(object.id);
    return creature?.POSTURE ?? null;
  }

  @FieldResolver()
  async shockWounds(@Root() object: IServerObject) {
    const creature = await this.creatureObjectService.load(object.id);
    return creature?.SHOCK_WOUNDS ?? null;
  }

  @FieldResolver()
  async masterId(@Root() object: IServerObject) {
    const creature = await this.creatureObjectService.load(object.id);
    return creature?.MASTER_ID ?? null;
  }

  @FieldResolver()
  async rank(@Root() object: IServerObject) {
    const creature = await this.creatureObjectService.load(object.id);
    return creature?.RANK ?? null;
  }

  @FieldResolver()
  async baseWalkSpeed(@Root() object: IServerObject) {
    const creature = await this.creatureObjectService.load(object.id);
    return creature?.BASE_WALK_SPEED ?? null;
  }

  @FieldResolver()
  async baseRunSpeed(@Root() object: IServerObject) {
    const creature = await this.creatureObjectService.load(object.id);
    return creature?.BASE_RUN_SPEED ?? null;
  }

  @FieldResolver()
  async attributes(@Root() object: IServerObject) {
    const creature = await this.creatureObjectService.load(object.id);

    if (!creature) return null;

    const attirbutes = [];

    for (let i = 0; i < Attributes.NumberOfAttributes; i++) {
      // @ts-ignore Revisit this when Typescript supports computed
      // template literal properties (TS 4.4?)
      attirbutes.push(creature[`ATTRIBUTE_${i}`]);
    }

    return attirbutes;
  }

  @FieldResolver()
  async persitedBuffs(@Root() object: IServerObject) {
    const creature = await this.creatureObjectService.load(object.id);
    return creature?.PERSISTED_BUFFS ?? null;
  }

  @FieldResolver()
  async worldspaceLocation(@Root() object: IServerObject) {
    const creature = await this.creatureObjectService.load(object.id);
    return creature ? ([creature.WS_X, creature.WS_Y, creature.WS_Z] as Location) : null;
  }
}
