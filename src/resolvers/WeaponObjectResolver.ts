import { FieldResolver, Resolver, ResolverInterface, Root } from 'type-graphql';
import { Service } from 'typedi';

import { WeaponObjectService } from '../services/WeaponObjectService';
import { WeaponObject } from '../types/WeaponObject';
import { IServerObject } from '../types/ServerObject';

@Resolver(() => WeaponObject)
@Service()
export class WeaponObjectResolver implements ResolverInterface<WeaponObject> {
  constructor(private readonly weaponObjectService: WeaponObjectService) {
    // Do nothing
  }

  @FieldResolver()
  async minDamage(@Root() object: IServerObject) {
    const wep = await this.weaponObjectService.load(object.id);
    return wep?.MIN_DAMAGE ?? null;
  }

  @FieldResolver()
  async maxDamage(@Root() object: IServerObject) {
    const wep = await this.weaponObjectService.load(object.id);
    return wep?.MAX_DAMAGE ?? null;
  }

  @FieldResolver()
  async damageType(@Root() object: IServerObject) {
    const wep = await this.weaponObjectService.load(object.id);
    return wep?.DAMAGE_TYPE ?? null;
  }

  @FieldResolver()
  async elementalType(@Root() object: IServerObject) {
    const wep = await this.weaponObjectService.load(object.id);
    return wep?.ELEMENTAL_TYPE ?? null;
  }

  @FieldResolver()
  async elementalValue(@Root() object: IServerObject) {
    const wep = await this.weaponObjectService.load(object.id);
    return wep?.ELEMENTAL_VALUE ?? null;
  }

  @FieldResolver()
  async attackSpeed(@Root() object: IServerObject) {
    const wep = await this.weaponObjectService.load(object.id);
    return wep?.ATTACK_SPEED ?? null;
  }

  @FieldResolver()
  async woundChance(@Root() object: IServerObject) {
    const wep = await this.weaponObjectService.load(object.id);
    return wep?.WOUND_CHANCE ?? null;
  }

  @FieldResolver()
  async accuracy(@Root() object: IServerObject) {
    const wep = await this.weaponObjectService.load(object.id);
    return wep?.ACCURACY ?? null;
  }

  @FieldResolver()
  async attackCost(@Root() object: IServerObject) {
    const wep = await this.weaponObjectService.load(object.id);
    return wep?.ATTACK_COST ?? null;
  }

  @FieldResolver()
  async damageRadius(@Root() object: IServerObject) {
    const wep = await this.weaponObjectService.load(object.id);
    return wep?.DAMAGE_RADIUS ?? null;
  }

  @FieldResolver()
  async minRange(@Root() object: IServerObject) {
    const wep = await this.weaponObjectService.load(object.id);
    return wep?.MIN_DAMAGE ?? null;
  }

  @FieldResolver()
  async maxRange(@Root() object: IServerObject) {
    const wep = await this.weaponObjectService.load(object.id);
    return wep?.MAX_DAMAGE ?? null;
  }

  @FieldResolver()
  async dps(@Root() object: IServerObject) {
    const wep = await this.weaponObjectService.load(object.id);

    if (!wep || !wep.MIN_DAMAGE || !wep.MAX_DAMAGE || !wep.ELEMENTAL_VALUE || !wep.ATTACK_SPEED) return 0;

    // DPS = ((min + max) / 2 + 2 * ele) / atkSpd
    return ((wep.MIN_DAMAGE + wep.MAX_DAMAGE) / 2 + 2 * wep.ELEMENTAL_VALUE) / wep.ATTACK_SPEED;
  }
}
