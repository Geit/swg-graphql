import { FieldResolver, Resolver, ResolverInterface, Root } from 'type-graphql';
import { Service } from 'typedi';

import { ShipObjectService } from '../services/ShipObjectService';
import { IServerObject } from '../types/ServerObject';
import { ShipObject } from '../types/ShipObject';

@Resolver(() => ShipObject)
@Service()
export class ShipObjectResolver implements ResolverInterface<ShipObject> {
  constructor(private readonly shipObjectService: ShipObjectService) {
    // Do nothing
  }

  @FieldResolver()
  async slideDampener(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.SLIDE_DAMPENER ?? null;
  }

  @FieldResolver()
  async currentChassisHitPoints(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.CURRENT_CHASSIS_HIT_POINTS ?? null;
  }

  @FieldResolver()
  async maximumChassisHitPoints(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.MAXIMUM_CHASSIS_HIT_POINTS ?? null;
  }

  @FieldResolver()
  async chassisType(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.CHASSIS_TYPE ?? null;
  }

  @FieldResolver()
  async cmpArmorHpMaximum(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.CMP_ARMOR_HP_MAXIMUM ?? null;
  }

  @FieldResolver()
  async cmpArmorHpCurrent(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.CMP_ARMOR_HP_CURRENT ?? null;
  }

  @FieldResolver()
  async cmpEfficiencyGeneral(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.CMP_EFFICIENCY_GENERAL ?? null;
  }

  @FieldResolver()
  async cmpEfficiencyEng(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.CMP_EFFICIENCY_ENG ?? null;
  }

  @FieldResolver()
  async cmpEngMaintenance(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.CMP_ENG_MAINTENANCE ?? null;
  }

  @FieldResolver()
  async cmpMass(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.CMP_MASS ?? null;
  }

  @FieldResolver()
  async cmpCrc(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.CMP_CRC ?? null;
  }

  @FieldResolver()
  async cmpHpCurrent(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.CMP_HP_CURRENT ?? null;
  }

  @FieldResolver()
  async cmpHpMaximum(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.CMP_HP_MAXIMUM ?? null;
  }

  @FieldResolver()
  async cmpFlags(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.CMP_FLAGS ?? null;
  }

  @FieldResolver()
  async cmpNames(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.CMP_NAMES ?? null;
  }

  @FieldResolver()
  async weaponDamageMaximum(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.WEAPON_DAMAGE_MAXIMUM ?? null;
  }

  @FieldResolver()
  async weaponDamageMinimum(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.WEAPON_DAMAGE_MINIMUM ?? null;
  }

  @FieldResolver()
  async weaponEffectivenessShields(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.WEAPON_EFFECTIVENESS_SHIELDS ?? null;
  }

  @FieldResolver()
  async weaponEffectivenessArmor(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.WEAPON_EFFECTIVENESS_ARMOR ?? null;
  }

  @FieldResolver()
  async weaponEngPerShot(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.WEAPON_ENG_PER_SHOT ?? null;
  }

  @FieldResolver()
  async weaponRefireRate(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.WEAPON_REFIRE_RATE ?? null;
  }

  @FieldResolver()
  async weaponAmmoCurrent(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.WEAPON_AMMO_CURRENT ?? null;
  }

  @FieldResolver()
  async weaponAmmoMaximum(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.WEAPON_AMMO_MAXIMUM ?? null;
  }

  @FieldResolver()
  async weaponAmmoType(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.WEAPON_AMMO_TYPE ?? null;
  }

  @FieldResolver()
  async shieldHpFrontMaximum(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.SHIELD_HP_FRONT_MAXIMUM ?? null;
  }

  @FieldResolver()
  async shieldHpBackMaximum(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.SHIELD_HP_BACK_MAXIMUM ?? null;
  }

  @FieldResolver()
  async shieldRechargeRate(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.SHIELD_RECHARGE_RATE ?? null;
  }

  @FieldResolver()
  async capacitorEngMaximum(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.CAPACITOR_ENG_MAXIMUM ?? null;
  }

  @FieldResolver()
  async capacitorEngRechargeRate(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.CAPACITOR_ENG_RECHARGE_RATE ?? null;
  }

  @FieldResolver()
  async engineAccRate(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.ENGINE_ACC_RATE ?? null;
  }

  @FieldResolver()
  async engineDecelerationRate(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.ENGINE_DECELERATION_RATE ?? null;
  }

  @FieldResolver()
  async enginePitchAccRate(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.ENGINE_PITCH_ACC_RATE ?? null;
  }

  @FieldResolver()
  async engineYawAccRate(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.ENGINE_YAW_ACC_RATE ?? null;
  }

  @FieldResolver()
  async engineRollAccRate(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.ENGINE_ROLL_ACC_RATE ?? null;
  }

  @FieldResolver()
  async enginePitchRateMaximum(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.ENGINE_PITCH_RATE_MAXIMUM ?? null;
  }

  @FieldResolver()
  async engineYawRateMaximum(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.ENGINE_YAW_RATE_MAXIMUM ?? null;
  }

  @FieldResolver()
  async engineRollRateMaximum(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.ENGINE_ROLL_RATE_MAXIMUM ?? null;
  }

  @FieldResolver()
  async engineSpeedMaximum(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.ENGINE_SPEED_MAXIMUM ?? null;
  }

  @FieldResolver()
  async reactorEngGenerationRate(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.REACTOR_ENG_GENERATION_RATE ?? null;
  }

  @FieldResolver()
  async boosterEngMaximum(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.BOOSTER_ENG_MAXIMUM ?? null;
  }

  @FieldResolver()
  async boosterEngRechargeRate(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.BOOSTER_ENG_RECHARGE_RATE ?? null;
  }

  @FieldResolver()
  async boosterEngConsumptionRate(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.BOOSTER_ENG_CONSUMPTION_RATE ?? null;
  }

  @FieldResolver()
  async boosterAcc(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.BOOSTER_ACC ?? null;
  }

  @FieldResolver()
  async boosterSpeedMaximum(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.BOOSTER_SPEED_MAXIMUM ?? null;
  }

  @FieldResolver()
  async droidIfCmdSpeed(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.DROID_IF_CMD_SPEED ?? null;
  }

  @FieldResolver()
  async installedDcd(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.INSTALLED_DCD ? String(ship.INSTALLED_DCD) : null;
  }

  @FieldResolver()
  async chassisCmpMassMaximum(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.CHASSIS_CMP_MASS_MAXIMUM ?? null;
  }

  @FieldResolver()
  async cmpCreators(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.CMP_CREATORS ?? null;
  }

  @FieldResolver()
  async cargoHoldContentsMaximum(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.CARGO_HOLD_CONTENTS_MAXIMUM ?? null;
  }

  @FieldResolver()
  async cargoHoldContentsCurrent(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.CARGO_HOLD_CONTENTS_CURRENT ?? null;
  }

  @FieldResolver()
  async cargoHoldContents(@Root() object: IServerObject) {
    const ship = await this.shipObjectService.load(object.id);

    return ship?.CARGO_HOLD_CONTENTS ?? null;
  }
}
