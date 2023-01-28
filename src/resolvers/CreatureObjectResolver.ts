import { FieldResolver, Resolver, ResolverInterface, Root } from 'type-graphql';
import { Inject, Service } from 'typedi';

import { CreatureObjectService } from '../services/CreatureObjectService';
import { CreatureObject, Attributes, IServerObject, Location } from '../types';

@Resolver(() => CreatureObject)
@Service()
export class CreatureObjectResolver implements ResolverInterface<CreatureObject> {
  @Inject()
  creatureObjectService: CreatureObjectService;

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

    const attributes: number[] = [];

    for (let i = 0; i < Attributes.NumberOfAttributes; i++) {
      const attributeVal = creature[`ATTRIBUTE_${i}`];

      if (typeof attributeVal === 'number') {
        attributes.push(attributeVal);
      }
    }

    return attributes;
  }

  @FieldResolver()
  async persitedBuffs(@Root() object: IServerObject) {
    const creature = await this.creatureObjectService.load(object.id);
    return creature?.PERSISTED_BUFFS ?? null;
  }

  @FieldResolver({ nullable: true })
  async worldspaceLocation(@Root() object: IServerObject) {
    const creature = await this.creatureObjectService.load(object.id);
    const location = creature ? ([creature.WS_X, creature.WS_Y, creature.WS_Z] as Location) : null;

    return location?.filter(n => typeof n === 'number').length === 3 ? location : null;
  }
}
