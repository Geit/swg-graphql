import fs from 'fs/promises';
import path from 'path';

import { Inject, Service } from 'typedi';

import { ShipPartSummary } from '../../resolvers/TangibleObjectResolver';
import getStringCrc from '../../utils/crc';
import { DataTableService } from '../DataTableService';
import { ObjVarService } from '../ObjVarService';
import { StringFileLoader } from '../StringFileLoader';

import {
  ShipPart,
  ShipPartStat,
  ShipPartType,
  StatBestInClassForReLevel,
  StatBestInClassMap,
} from './shipPartStatTypes';
import { COMPONENT_CLASS_DATA } from './componentClassData';
import { calcZScore, getZPercentile } from './statisticsUtils';

const RE_LEVEL_KEY = 'reverseEngineeringLevel';
const TYPE_KEY = 'strType';

interface StajTier {
  name: string;
  color: string;
}

interface StajPartData {
  statName: string;
  statDescription?: string;
  tierThresholds: number[];
}

type PartAbbrev = 'a' | 'e' | 'w' | 's' | 'r' | 'c' | 'b' | 'd';
type PartLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type PartShortName = `${PartAbbrev}${PartLevel}`;

const getComparisonValueForStat = (stat: ShipPartStat) =>
  stat.inverse ? stat.mean - stat.stdDev : stat.mean + stat.stdDev;

@Service({ global: true, eager: true })
export class ShipPartStatService {
  @Inject()
  private readonly dataTable: DataTableService;

  @Inject()
  private readonly objvarService: ObjVarService;

  @Inject()
  private readonly stringService: StringFileLoader;

  shipPartMap = new Map<number, ShipPart>();
  bestInClassForPartMap = new Map<ShipPartType, StatBestInClassMap>();

  loadingHandle: false | Promise<unknown> = false;

  stajTiers: StajTier[] = [];
  stajPartData: Map<PartShortName, Map<string, StajPartData>> = new Map();

  private async loadShipParts() {
    if (!this.loadingHandle) {
      try {
        this.loadingHandle = Promise.all([this.loadShipPartsFromDatatables(), this.loadStajData()]);
        await this.loadingHandle;
      } catch (err) {
        this.loadingHandle = false;
        throw err;
      }
    }

    return this.loadingHandle;
  }

  private async loadShipPartsFromDatatables() {
    for (const [className, classData] of Object.entries(COMPONENT_CLASS_DATA)) {
      // TODO: This could be better typed, but each component datatable has its own unique signature,
      // so would have to have a type lookup map.
      type ComponentDatatableRow = Record<string, string | number>;
      const components = await this.dataTable.load<ComponentDatatableRow>({
        fileName: `ship/components/${className}.iff`,
      });
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

  async getStajFile() {
    const filePath = path.join(__dirname, '../../../data', 'spaceloot.txt');
    try {
      const stajFile = await fs.readFile(filePath, { encoding: 'utf-8' });
      return stajFile;
    } catch {
      return null;
    }
  }

  async loadStajData() {
    const stajFile = await this.getStajFile();

    if (!stajFile) return;

    const lines = stajFile.split('\n');

    lines.forEach(line => {
      if (line.trim().startsWith('#') || line.trim().length === 0) return;

      const lineFields = line.split(',') as [PartShortName | 'tiers', ...string[]];

      const lineType = lineFields[0];

      if (lineType === 'tiers') {
        lineFields.forEach((lineField, idx) => {
          if (idx < 1) return;

          const [tierColor, tierName] = lineField.split(':');

          this.stajTiers.push({
            name: tierName,
            color: tierColor,
          });
        });
      } else if (/[aewsrcbd]\d/.test(lineType)) {
        // Otherwise it's a stat definition line
        const tierThresholds: number[] = [];

        lineFields.forEach((lineField, idx) => {
          if (idx < 2) return;
          tierThresholds.push(parseFloat(lineField));
        });
        const partMap = this.stajPartData.get(lineType) ?? new Map<string, StajPartData>();

        const [statName, statDescription] = lineFields[1].split(':') as [string, string | undefined];
        partMap.set(statName, {
          statName,
          statDescription,
          tierThresholds,
        });
        this.stajPartData.set(lineType, partMap);
      }
    });
  }

  async lookupShipPartStats(objectId: string, crc: number): Promise<ShipPartSummary | null> {
    await this.loadShipParts();

    const part = this.shipPartMap.get(crc);

    if (!part) return null;

    const bestInClassForStat = this.bestInClassForPartMap.get(part.type);

    const stajDataForPart = this.stajPartData.get(`${part.type[0].toLowerCase()}${part.reLevel % 10}` as PartShortName);

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

      const stajDataForStat = stajDataForPart?.get(stat.name);
      const stajTierIndex = stajDataForStat?.tierThresholds.reduce((acc, threshold, idx) => {
        if ((stat.inverse && value <= threshold) || (!stat.inverse && value >= threshold)) return idx;
        return acc;
      }, 0);

      return {
        name: attributeNames[stat.name] ?? stat.name,
        value,
        percentile,
        stajTier: typeof stajTierIndex !== 'undefined' ? this.stajTiers[stajTierIndex] : null,
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
