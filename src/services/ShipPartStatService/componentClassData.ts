import { ShipPartStatLookup, ShipPartType } from './shipPartStatTypes';

export const COMPONENT_CLASS_DATA: Record<ShipPartType, { stats: readonly ShipPartStatLookup[] }> = {
  armor: {
    stats: [
      {
        name: 'ship_component_hitpoints',
        meanKey: 'fltMaximumArmorHitpoints',
        stdDevKey: 'fltMaximumArmorHitpointsMod',
        objVarKey: 'ship_comp.armor_hitpoints_maximum',
      },
      {
        name: 'ship_component_mass',
        meanKey: 'fltMass',
        stdDevKey: 'fltMassModifier',
        objVarKey: 'ship_comp.mass',
        inverse: true,
      },
    ],
  },
  engine: {
    stats: [
      {
        name: 'ship_component_hitpoints',
        meanKey: 'fltMaximumArmorHitpoints',
        stdDevKey: 'fltMaximumArmorHitpointsMod',
        objVarKey: 'ship_comp.armor_hitpoints_maximum',
      },
      {
        name: 'ship_component_mass',
        meanKey: 'fltMass',
        stdDevKey: 'fltMassModifier',
        objVarKey: 'ship_comp.mass',
        inverse: true,
      },
      {
        name: 'ship_component_energy_required',
        meanKey: 'fltEnergyMaintenance',
        stdDevKey: 'fltEnergyMaintenanceModifier',
        objVarKey: 'ship_comp.energy_maintenance_requirement',
        inverse: true,
      },
      {
        name: 'ship_component_engine_speed_maximum',
        meanKey: 'fltMaxSpeed',
        stdDevKey: 'fltMaxSpeedModifier',
        objVarKey: 'ship_comp.engine.speed_maximum',
      },
      {
        name: 'ship_component_engine_pitch_rate_maximum',
        meanKey: 'fltMaxPitch',
        stdDevKey: 'fltMaxPitchModifier',
        objVarKey: 'ship_comp.engine.pitch_rate_maximum',
      },
      {
        name: 'ship_component_engine_roll_rate_maximum',
        meanKey: 'fltMaxRoll',
        stdDevKey: 'fltMaxRollModifier',
        objVarKey: 'ship_comp.engine.roll_rate_maximum',
      },
      {
        name: 'ship_component_engine_yaw_rate_maximum',
        meanKey: 'fltMaxYaw',
        stdDevKey: 'fltMaxYawModifier',
        objVarKey: 'ship_comp.engine.yaw_rate_maximum',
      },
    ],
  },
  weapon: {
    stats: [
      {
        name: 'ship_component_hitpoints',
        meanKey: 'fltMaximumArmorHitpoints',
        stdDevKey: 'fltMaximumArmorHitpointsMod',
        objVarKey: 'ship_comp.armor_hitpoints_maximum',
      },
      {
        name: 'ship_component_mass',
        meanKey: 'fltMass',
        stdDevKey: 'fltMassModifier',
        objVarKey: 'ship_comp.mass',
        inverse: true,
      },
      {
        name: 'ship_component_energy_required',
        meanKey: 'fltEnergyMaintenance',
        stdDevKey: 'fltEnergyMaintenanceModifier',
        objVarKey: 'ship_comp.energy_maintenance_requirement',
        inverse: true,
      },
      {
        name: 'ship_component_weapon_damage_minimum',
        meanKey: 'fltMinDamage',
        stdDevKey: 'fltMinDamageModifier',
        objVarKey: 'ship_comp.weapon.damage_minimum',
      },
      {
        name: 'ship_component_weapon_damage_maximum',
        meanKey: 'fltMaxDamage',
        stdDevKey: 'fltMaxDamageModifier',
        objVarKey: 'ship_comp.weapon.damage_maximum',
      },
      {
        name: 'ship_component_weapon_effectiveness_shields',
        meanKey: 'fltShieldEffectiveness',
        stdDevKey: 'fltShieldEffectivenessModifier',
        objVarKey: 'ship_comp.weapon.effectiveness_shields',
      },
      {
        name: 'ship_component_weapon_effectiveness_armor',
        meanKey: 'fltArmorEffectiveness',
        stdDevKey: 'fltArmorEffectivenessModifier',
        objVarKey: 'ship_comp.weapon.effectiveness_armor',
      },
      {
        name: 'ship_component_weapon_energy_per_shot',
        meanKey: 'fltEnergyPerShot',
        stdDevKey: 'fltEnergyPerShotModifier',
        objVarKey: 'ship_comp.weapon.energy_per_shot',
        inverse: true,
      },
      {
        name: 'ship_component_weapon_refire_rate',
        meanKey: 'fltRefireRate',
        stdDevKey: 'fltRefireRateModifier',
        objVarKey: 'ship_comp.weapon.refire_rate',
        inverse: true,
      },
    ],
  },
  shield: {
    stats: [
      {
        name: 'ship_component_hitpoints',
        meanKey: 'fltMaximumArmorHitpoints',
        stdDevKey: 'fltMaximumArmorHitpointsMod',
        objVarKey: 'ship_comp.armor_hitpoints_maximum',
      },
      {
        name: 'ship_component_mass',
        meanKey: 'fltMass',
        stdDevKey: 'fltMassModifier',
        objVarKey: 'ship_comp.mass',
        inverse: true,
      },
      {
        name: 'ship_component_energy_required',
        meanKey: 'fltEnergyMaintenance',
        stdDevKey: 'fltEnergyMaintenanceModifier',
        objVarKey: 'ship_comp.energy_maintenance_requirement',
        inverse: true,
      },
      {
        name: 'ship_component_shield_hitpoints_front',
        meanKey: 'fltShieldHitpointsMaximumFront',
        stdDevKey: 'fltShieldHitpointsMaximumFrontModifier',
        objVarKey: 'ship_comp.shield.hitpoints_front_maximum',
      },
      {
        name: 'ship_component_shield_hitpoints_back',
        meanKey: 'fltShieldHitpointsMaximumBack',
        stdDevKey: 'fltShieldHitpointsMaximumBackModifier',
        objVarKey: 'ship_comp.shield.hitpoints_back_maximum',
      },
      {
        name: 'ship_component_shield_recharge_rate',
        meanKey: 'fltShieldRechargeRate',
        stdDevKey: 'fltShieldRechargeRateModifier',
        objVarKey: 'ship_comp.shield.recharge_rate',
      },
    ],
  },
  reactor: {
    stats: [
      {
        name: 'ship_component_hitpoints',
        meanKey: 'fltMaximumArmorHitpoints',
        stdDevKey: 'fltMaximumArmorHitpointsMod',
        objVarKey: 'ship_comp.armor_hitpoints_maximum',
      },
      {
        name: 'ship_component_mass',
        meanKey: 'fltMass',
        stdDevKey: 'fltMassModifier',
        objVarKey: 'ship_comp.mass',
        inverse: true,
      },
      {
        name: 'ship_component_reactor_generation_rate',
        meanKey: 'fltEnergyGeneration',
        stdDevKey: 'fltEnergyGenerationModifier',
        objVarKey: 'ship_comp.reactor.energy_generation_rate',
      },
    ],
  },
  capacitor: {
    stats: [
      {
        name: 'ship_component_hitpoints',
        meanKey: 'fltMaximumArmorHitpoints',
        stdDevKey: 'fltMaximumArmorHitpointsMod',
        objVarKey: 'ship_comp.armor_hitpoints_maximum',
      },
      {
        name: 'ship_component_mass',
        meanKey: 'fltMass',
        stdDevKey: 'fltMassModifier',
        objVarKey: 'ship_comp.mass',
        inverse: true,
      },
      {
        name: 'ship_component_energy_required',
        meanKey: 'fltEnergyMaintenance',
        stdDevKey: 'fltEnergyMaintenanceModifier',
        objVarKey: 'ship_comp.energy_maintenance_requirement',
        inverse: true,
      },
      {
        name: 'ship_component_capacitor_energy',
        meanKey: 'fltMaxEnergy',
        stdDevKey: 'fltMaxEnergyModifier',
        objVarKey: 'ship_comp.capacitor.energy_maximum',
      },
      {
        name: 'ship_component_capacitor_energy_recharge_rate',
        meanKey: 'fltRechargeRate',
        stdDevKey: 'fltRechargeRateModifier',
        objVarKey: 'ship_comp.capacitor.energy_recharge_rate',
      },
    ],
  },
  booster: {
    stats: [
      {
        name: 'ship_component_hitpoints',
        meanKey: 'fltMaximumArmorHitpoints',
        stdDevKey: 'fltMaximumArmorHitpointsMod',
        objVarKey: 'ship_comp.armor_hitpoints_maximum',
      },
      {
        name: 'ship_component_mass',
        meanKey: 'fltMass',
        stdDevKey: 'fltMassModifier',
        objVarKey: 'ship_comp.mass',
        inverse: true,
      },
      {
        name: 'ship_component_energy_required',
        meanKey: 'fltEnergyMaintenance',
        stdDevKey: 'fltEnergyMaintenanceModifier',
        objVarKey: 'ship_comp.energy_maintenance_requirement',
        inverse: true,
      },
      {
        name: 'ship_component_booster_energy',
        meanKey: 'fltMaximumEnergy',
        stdDevKey: 'fltMaximumEnergyModifier',
        objVarKey: 'ship_comp.booster.energy_maximum',
      },
      {
        name: 'ship_component_booster_energy_recharge_rate',
        meanKey: 'fltRechargeRate',
        stdDevKey: 'fltRechargeRateModifier',
        objVarKey: 'ship_comp.booster.energy_recharge_rate',
      },
    ],
  },
  // eslint-disable-next-line camelcase
  cargo_hold: {
    stats: [
      {
        name: 'ship_component_hitpoints',
        meanKey: 'fltMaximumArmorHitpoints',
        stdDevKey: 'fltMaximumArmorHitpointsMod',
        objVarKey: 'ship_comp.armor_hitpoints_maximum',
      },
      {
        name: 'ship_component_mass',
        meanKey: 'fltMass',
        stdDevKey: 'fltMassModifier',
        objVarKey: 'ship_comp.mass',
        inverse: true,
      },
      {
        name: 'ship_component_energy_required',
        meanKey: 'fltEnergyMaintenance',
        stdDevKey: 'fltEnergyMaintenanceModifier',
        objVarKey: 'ship_comp.energy_maintenance_requirement',
        inverse: true,
      },
    ],
  },
  // eslint-disable-next-line camelcase
  droid_interface: {
    stats: [
      {
        name: 'ship_component_hitpoints',
        meanKey: 'fltMaximumArmorHitpoints',
        stdDevKey: 'fltMaximumArmorHitpointsMod',
        objVarKey: 'ship_comp.armor_hitpoints_maximum',
      },
      {
        name: 'ship_component_mass',
        meanKey: 'fltMass',
        stdDevKey: 'fltMassModifier',
        objVarKey: 'ship_comp.mass',
        inverse: true,
      },
      {
        name: 'ship_component_energy_required',
        meanKey: 'fltEnergyMaintenance',
        stdDevKey: 'fltEnergyMaintenanceModifier',
        objVarKey: 'ship_comp.energy_maintenance_requirement',
        inverse: true,
      },
      {
        name: 'ship_component_droidinterface_speed',
        meanKey: 'fltCommandSpeed',
        stdDevKey: 'fltCommandSpeedModifier',
        inverse: true,
        objVarKey: 'ship_comp.droid_interface.command_speed',
      },
    ],
  },
} as const;
