import { Field, Float, Int, ID, ObjectType } from 'type-graphql';

import { IServerObject } from './ServerObject';
import { ITangibleObject } from './TangibleObject';

@ObjectType({ implements: [ITangibleObject, IServerObject] })
export class ShipObject extends ITangibleObject {
  @Field(() => Float, { nullable: true })
  slideDampener: number | null;

  @Field(() => Float, { nullable: true })
  currentChassisHitPoints: number | null;

  @Field(() => Float, { nullable: true })
  maximumChassisHitPoints: number | null;

  @Field(() => Int, { nullable: true })
  chassisType: number | null;

  @Field(() => String, { nullable: true })
  cmpArmorHpMaximum: string | null;

  @Field(() => String, { nullable: true })
  cmpArmorHpCurrent: string | null;

  @Field(() => String, { nullable: true })
  cmpEfficiencyGeneral: string | null;

  @Field(() => String, { nullable: true })
  cmpEfficiencyEng: string | null;

  @Field(() => String, { nullable: true })
  cmpEngMaintenance: string | null;

  @Field(() => String, { nullable: true })
  cmpMass: string | null;

  @Field(() => String, { nullable: true })
  cmpCrc: string | null;

  @Field(() => String, { nullable: true })
  cmpHpCurrent: string | null;

  @Field(() => String, { nullable: true })
  cmpHpMaximum: string | null;

  @Field(() => String, { nullable: true })
  cmpFlags: string | null;

  @Field(() => String, { nullable: true })
  cmpNames: string | null;

  @Field(() => String, { nullable: true })
  weaponDamageMaximum: string | null;

  @Field(() => String, { nullable: true })
  weaponDamageMinimum: string | null;

  @Field(() => String, { nullable: true })
  weaponEffectivenessShields: string | null;

  @Field(() => String, { nullable: true })
  weaponEffectivenessArmor: string | null;

  @Field(() => String, { nullable: true })
  weaponEngPerShot: string | null;

  @Field(() => String, { nullable: true })
  weaponRefireRate: string | null;

  @Field(() => String, { nullable: true })
  weaponAmmoCurrent: string | null;

  @Field(() => String, { nullable: true })
  weaponAmmoMaximum: string | null;

  @Field(() => String, { nullable: true })
  weaponAmmoType: string | null;

  @Field(() => Float, { nullable: true })
  shieldHpFrontMaximum: number | null;

  @Field(() => Float, { nullable: true })
  shieldHpBackMaximum: number | null;

  @Field(() => Float, { nullable: true })
  shieldRechargeRate: number | null;

  @Field(() => Float, { nullable: true })
  capacitorEngMaximum: number | null;

  @Field(() => Float, { nullable: true })
  capacitorEngRechargeRate: number | null;

  @Field(() => Float, { nullable: true })
  engineAccRate: number | null;

  @Field(() => Float, { nullable: true })
  engineDecelerationRate: number | null;

  @Field(() => Float, { nullable: true })
  enginePitchAccRate: number | null;

  @Field(() => Float, { nullable: true })
  engineYawAccRate: number | null;

  @Field(() => Float, { nullable: true })
  engineRollAccRate: number | null;

  @Field(() => Float, { nullable: true })
  enginePitchRateMaximum: number | null;

  @Field(() => Float, { nullable: true })
  engineYawRateMaximum: number | null;

  @Field(() => Float, { nullable: true })
  engineRollRateMaximum: number | null;

  @Field(() => Float, { nullable: true })
  engineSpeedMaximum: number | null;

  @Field(() => Float, { nullable: true })
  reactorEngGenerationRate: number | null;

  @Field(() => Float, { nullable: true })
  boosterEngMaximum: number | null;

  @Field(() => Float, { nullable: true })
  boosterEngRechargeRate: number | null;

  @Field(() => Float, { nullable: true })
  boosterEngConsumptionRate: number | null;

  @Field(() => Float, { nullable: true })
  boosterAcc: number | null;

  @Field(() => Float, { nullable: true })
  boosterSpeedMaximum: number | null;

  @Field(() => Float, { nullable: true })
  droidIfCmdSpeed: number | null;

  @Field(() => ID)
  installedDcd: string | null;

  @Field(() => Float, { nullable: true })
  chassisCmpMassMaximum: number | null;

  @Field(() => String, { nullable: true })
  cmpCreators: string | null;

  @Field(() => Int, { nullable: true })
  cargoHoldContentsMaximum: number | null;

  @Field(() => Int, { nullable: true })
  cargoHoldContentsCurrent: number | null;

  @Field(() => String, { nullable: true })
  cargoHoldContents: string | null;
}
