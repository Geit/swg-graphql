import { Inject, Service } from 'typedi';

import { ShipPartSummary } from '../resolvers/TangibleObjectResolver';
import getStringCrc from '../utils/crc';

import { DataTableService } from './DataTableService';
import { ObjVarService } from './ObjVarService';
import { StringFileLoader } from './StringFileLoader';

const RE_LEVEL_KEY = 'reverseEngineeringLevel';
const TYPE_KEY = 'strType';

type StatName = string;

interface ShipPartStatLookup {
  name: StatName;
  meanKey: string;
  stdDevKey: string;
  inverse?: boolean;
  objVarKey: string;
}

type ShipPartType =
  | 'armor'
  | 'engine'
  | 'weapon'
  | 'shield'
  | 'reactor'
  | 'capacitor'
  | 'booster'
  | 'cargo_hold'
  | 'droid_interface';

const COMPONENT_CLASS_DATA: Record<ShipPartType, { stats: readonly ShipPartStatLookup[] }> = {
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
        name: 'Minimum Damage',
        meanKey: 'fltMinDamage',
        stdDevKey: 'fltMinDamageModifier',
        objVarKey: 'ship_comp.weapon.damage_minimum',
      },
      {
        name: 'Maximum Damage',
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

interface ShipPartStat {
  name: StatName;
  mean: number;
  stdDev: number;
  inverse?: boolean;
  objVarKey: string;
}

type RELevel = number;

interface ShipPart {
  crc: number;
  type: ShipPartType;
  name: string;
  reLevel: number;
  stats: ShipPartStat[];
}

type StatBestInClassForReLevel = Map<RELevel, ShipPartStat>;
type StatBestInClassMap = Map<StatName, StatBestInClassForReLevel>;

const getComparisonValueForStat = (stat: ShipPartStat) =>
  stat.inverse ? stat.mean - stat.stdDev : stat.mean + stat.stdDev;

const calcZScore = (mean: number, stdDev: number, value: number) => {
  return (value - mean) / stdDev;
};

const getZPercentile = (z: number) => {
  // If z is greater than 6.5 standard deviations from the mean
  // the number of significant digits will be outside of a reasonable
  // range.
  if (z < -6.5) return 0.0;
  if (z > 6.5) return 1.0;

  let factK = 1;
  let sum = 0;
  let term = 1;
  let k = 0;
  const loopStop = Math.exp(-23);

  while (Math.abs(term) > loopStop) {
    term =
      (((0.3989422804 * Math.pow(-1, k) * Math.pow(z, k)) / (2 * k + 1) / Math.pow(2, k)) * Math.pow(z, k + 1)) / factK;
    sum += term;
    k += 1;
    factK *= k;
  }

  sum += 0.5;

  return sum;
};

@Service({ global: true, eager: true })
export class ShipPartStatService {

  @Inject()
  private readonly dataTable: DataTableService;

  @Inject()
  private readonly objvarService: ObjVarService;

  @Inject()
  private readonly stringService: StringFileLoader

  shipPartMap = new Map<number, ShipPart>();
  bestInClassForPartMap = new Map<ShipPartType, StatBestInClassMap>();

  loadingHandle: false | Promise<void> = false;

  private async loadShipParts() {
    if(this.loadingHandle)
      return this.loadingHandle;
    
    try {
      this.loadingHandle = this.loadShipPartsFromDatatables();
    } 
    catch (err)
    {
      this.loadingHandle = false;
      throw err;
    }
  }

  private async loadShipPartsFromDatatables() {
    for (const [className, classData] of Object.entries(COMPONENT_CLASS_DATA)) {
      const components = (await this.dataTable.load(`ship/components/${className}.iff`)) as Record<
        string,
        string | number
      >[];
      const bestInClass: StatBestInClassMap = new Map();

      components.forEach(component => {
        const partName = component[TYPE_KEY] as string;
        const reLevel = component[RE_LEVEL_KEY] as number;

        const stats = classData.stats.map(stat => {
          const mean = Number(component[stat.meanKey]);
          const modifier = Number(component[stat.stdDevKey]);
          const stdDev = (mean * modifier) / 2;
          const statData: ShipPartStat = {
            name: stat.name,
            mean,
            stdDev,
            inverse: stat.inverse,
            objVarKey: stat.objVarKey,
          };

          const isInverse = stat.inverse;
          const bestInClassForComponent: StatBestInClassForReLevel = bestInClass.get(stat.name) ?? new Map();
          const currentBestStat = bestInClassForComponent.get(reLevel);
          const currentBestVal = currentBestStat ? getComparisonValueForStat(currentBestStat) : undefined;
          const newVal = getComparisonValueForStat(statData);

          if (!currentBestVal || (isInverse && newVal < currentBestVal) || (!isInverse && newVal > currentBestVal)) {
            bestInClassForComponent.set(reLevel, statData);
            bestInClass.set(stat.name, bestInClassForComponent);
          }

          return statData;
        });

        const crc = getStringCrc(partName);

        this.shipPartMap.set(crc, {
          name: partName,
          type: className as ShipPartType,
          crc,
          reLevel,
          stats,
        });
      });

      this.bestInClassForPartMap.set(className as ShipPartType, bestInClass);
    }
  }

  async isShipPart(crc: number): Promise<boolean> {
    await this.loadShipParts();

    return this.shipPartMap.has(crc);
  }

  async lookupShipPartStats(objectId: string, crc: number): Promise<ShipPartSummary | null> {
    await this.loadShipParts();

    const part = this.shipPartMap.get(crc);

    if (!part) return null;

    const bestInClassForStat = this.bestInClassForPartMap.get(part.type);

    const classData = COMPONENT_CLASS_DATA[part.type];
    const [attributeNames, objvars] = await Promise.all([
      this.stringService.load('obj_attr_n'),
      this.objvarService.getObjVarsForObject(objectId),
    ]);

    const stats = classData.stats.map(stat => {
      const value = objvars.find(ov => ov.name === stat.objVarKey)?.value as number;

      const bestInClassForReLevel = bestInClassForStat?.get(stat.name);
      const bestInClassStat = bestInClassForReLevel?.get(part.reLevel);

      let percentile = null;
      if (value && bestInClassStat) {
        const zScore = calcZScore(bestInClassStat.mean, bestInClassStat.stdDev, value);
        percentile = getZPercentile(zScore);

        if (stat.inverse) percentile = 1 - percentile;

        percentile *= 100;
      }

      return {
        name: attributeNames[stat.name] ?? stat.name,
        value,
        percentile,
      };
    });

    return {
      isReverseEngineered: ((objvars.find(ov => ov.name === 'ship_comp.flags')?.value as number) & (1 << 4)) !== 0,
      reverseEngineeringLevel: part.reLevel,
      stats,
      headlinePercentile: stats.reduce(
        (acc, cur) => (cur.percentile && cur.percentile > acc ? cur.percentile : acc),
        0
      ),
    };
  }
}
